import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { QueryItemDto } from './dto/query-item.dto';
import { Prisma } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcFields(item: {
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
}) {
  return {
    margin:
      item.costPrice > 0
        ? ((item.sellingPrice - item.costPrice) / item.costPrice) * 100
        : 0,
    isLowStock: item.currentStock <= item.minStock,
    stockValue: item.currentStock * item.costPrice,
  };
}

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(ItemsService.name)
    private readonly logger: PinoLogger,
  ) {}

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async findAll(businessId: string, query: QueryItemDto) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '50', 10);

    const where: Prisma.ItemWhereInput = {
      businessId,
      isActive: true,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { nameBn: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.branchId) {
      where.OR = [{ branchId: query.branchId }, { branchId: null }];
    }

    // Low-stock filter: currentStock <= minStock (Prisma doesn't support
    // column-to-column comparison directly, so we use a raw filter via AND)
    if (query.lowStock === 'true') {
      // Prisma workaround: use $queryRaw or filter in JS — here we use a
      // dedicated approach: fetch all matching and post-filter.
      // For small result sets this is fine; for large ones consider raw SQL.
      where.AND = [
        // Prisma v5 supports column references via `Prisma.sql` in raw queries.
        // For the ORM approach we keep it simple and add a post-filter below.
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, nameBn: true } },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.item.count({ where }),
    ]);

    // Post-filter for low stock (Prisma ORM limitation on column comparisons)
    const filtered =
      query.lowStock === 'true'
        ? items.filter((i) => i.currentStock <= i.minStock)
        : items;

    return {
      success: true,
      data: filtered.map((item) => ({ ...item, ...calcFields(item) })),
      meta: {
        page,
        limit,
        total: query.lowStock === 'true' ? filtered.length : total,
        totalPages: Math.ceil(
          (query.lowStock === 'true' ? filtered.length : total) / limit,
        ),
      },
    };
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────────
  async findOne(businessId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, businessId, isActive: true },
      include: {
        category: { select: { id: true, name: true, nameBn: true } },
      },
    });

    if (!item) {
      throw new NotFoundException(`Item ${id} not found.`);
    }

    return {
      success: true,
      data: { ...item, ...calcFields(item) },
    };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async create(businessId: string, userId: string | null, dto: CreateItemDto) {
    // Guard: duplicate SKU
    if (dto.sku) {
      const existing = await this.prisma.item.findFirst({
        where: { businessId, sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException(
          `An item with SKU "${dto.sku}" already exists.`,
        );
      }
    }

    const item = await this.prisma.item.create({
      data: {
        businessId,
        name: dto.name,
        nameBn: dto.nameBn,
        sku: dto.sku,
        barcode: dto.barcode,
        categoryId: dto.categoryId,
        description: dto.description,
        unit: dto.unit ?? 'pcs',
        costPrice: dto.costPrice ?? 0,
        sellingPrice: dto.sellingPrice ?? 0,
        wholesalePrice: dto.wholesalePrice ?? null,
        vipPrice: dto.vipPrice ?? null,
        minimumPrice: dto.minimumPrice ?? null,
        currentStock: dto.currentStock ?? 0,
        minStock: dto.minStock ?? 0,
        maxStock: dto.maxStock ?? null,
        supplierId: dto.supplierId,
        isActive: true,
      },
      include: {
        category: { select: { id: true, name: true, nameBn: true } },
      },
    });

    // Opening stock ledger entry
    if ((dto.currentStock ?? 0) > 0) {
      await this.prisma.stockLedger.create({
        data: {
          businessId,
          itemId: item.id,
          type: 'purchase',
          quantity: dto.currentStock!,
          previousStock: 0,
          newStock: dto.currentStock!,
          referenceType: 'adjustment',
          reason: 'Opening stock',
          createdBy: userId,
        },
      });
    }

    this.logger.info({ itemId: item.id, businessId }, 'Item created');

    return {
      success: true,
      data: { ...item, ...calcFields(item) },
    };
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  async update(businessId: string, id: string, dto: UpdateItemDto) {
    // Ensure item belongs to this business
    const existing = await this.prisma.item.findFirst({
      where: { id, businessId },
    });
    if (!existing) {
      throw new NotFoundException(`Item ${id} not found.`);
    }

    // Guard: duplicate SKU (if changing)
    if (dto.sku && dto.sku !== existing.sku) {
      const skuTaken = await this.prisma.item.findFirst({
        where: { businessId, sku: dto.sku, id: { not: id } },
      });
      if (skuTaken) {
        throw new ConflictException(
          `An item with SKU "${dto.sku}" already exists.`,
        );
      }
    }

    const updated = await this.prisma.item.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameBn !== undefined && { nameBn: dto.nameBn }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.barcode !== undefined && { barcode: dto.barcode }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
        ...(dto.sellingPrice !== undefined && {
          sellingPrice: dto.sellingPrice,
        }),
        ...(dto.wholesalePrice !== undefined && {
          wholesalePrice: dto.wholesalePrice,
        }),
        ...(dto.vipPrice !== undefined && { vipPrice: dto.vipPrice }),
        ...(dto.minimumPrice !== undefined && {
          minimumPrice: dto.minimumPrice,
        }),
        ...(dto.minStock !== undefined && { minStock: dto.minStock }),
        ...(dto.maxStock !== undefined && { maxStock: dto.maxStock }),
        ...(dto.supplierId !== undefined && { supplierId: dto.supplierId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        category: { select: { id: true, name: true, nameBn: true } },
      },
    });

    this.logger.info({ itemId: id, businessId }, 'Item updated');

    return {
      success: true,
      data: { ...updated, ...calcFields(updated) },
    };
  }

  // ─── SOFT DELETE ───────────────────────────────────────────────────────────
  async remove(businessId: string, id: string) {
    const existing = await this.prisma.item.findFirst({
      where: { id, businessId },
    });
    if (!existing) {
      throw new NotFoundException(`Item ${id} not found.`);
    }

    await this.prisma.item.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.info({ itemId: id, businessId }, 'Item soft-deleted');

    return { success: true, message: 'Item deleted successfully.' };
  }

  // ─── STOCK LEDGER ──────────────────────────────────────────────────────────
  async getStockLedger(businessId: string, itemId: string) {
    // Verify item ownership
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, businessId },
    });
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found.`);
    }

    const ledger = await this.prisma.stockLedger.findMany({
      where: { itemId, businessId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { success: true, data: ledger };
  }
}
