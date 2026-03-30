import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { QueryItemDto } from './dto/query-item.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { ImportItemsDto } from './dto/import-items.dto';
import { StockTransferDto } from './dto/stock-transfer.dto';
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
  async findAll(businessId: string, branchId: string, query: QueryItemDto) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '50', 10);

    const where: Prisma.ItemWhereInput = {
      businessId,
      branchId,
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

    // Post-filter for low stock (Prisma ORM can't compare two columns natively)
    const filtered =
      query.lowStock === 'true'
        ? items.filter((i) => i.currentStock <= i.minStock)
        : items;

    const filteredTotal = query.lowStock === 'true' ? filtered.length : total;

    return {
      success: true,
      data: filtered.map((item) => ({ ...item, ...calcFields(item) })),
      meta: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    };
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────────
  // Matches Next.js GET /api/items/[id] — includes last 10 stock history entries
  async findOne(businessId: string, branchId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, businessId, branchId },
      include: {
        category: { select: { id: true, name: true, nameBn: true } },
      },
    });

    if (!item) {
      throw new NotFoundException(`Item ${id} not found.`);
    }

    const stockHistory = await this.prisma.stockLedger.findMany({
      where: { itemId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      data: {
        ...item,
        ...calcFields(item),
        stockHistory,
      },
    };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async create(
    businessId: string,
    branchId: string,
    userId: string | null,
    dto: CreateItemDto,
  ) {
    if (dto.sku) {
      const existing = await this.prisma.item.findFirst({
        where: { businessId, branchId, sku: dto.sku },
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
        branchId,
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
        trackBatch: dto.trackBatch ?? false,
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
          branchId,
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

  // ─── FILE IMPORT ───────────────────────────────────────────────────────────
  async importItems(
    businessId: string,
    branchId: string,
    userId: string | null,
    dto: ImportItemsDto,
  ) {
    const results = await this.prisma.$transaction(
      async (tx) => {
        const createdItems: any[] = [];
        for (const itemDto of dto.items) {
          if (itemDto.sku) {
            const existing = await tx.item.findFirst({
              where: { businessId, branchId, sku: itemDto.sku },
            });
            if (existing) {
              throw new ConflictException(
                `An item with SKU "${itemDto.sku}" already exists.`,
              );
            }
          }

          const item = await tx.item.create({
            data: {
              businessId,
              branchId,
              name: itemDto.name,
              nameBn: itemDto.nameBn,
              sku: itemDto.sku,
              barcode: itemDto.barcode,
              categoryId: itemDto.categoryId,
              description: itemDto.description,
              unit: itemDto.unit ?? 'pcs',
              costPrice: itemDto.costPrice ?? 0,
              sellingPrice: itemDto.sellingPrice ?? 0,
              wholesalePrice: itemDto.wholesalePrice ?? null,
              vipPrice: itemDto.vipPrice ?? null,
              minimumPrice: itemDto.minimumPrice ?? null,
              currentStock: itemDto.currentStock ?? 0,
              minStock: itemDto.minStock ?? 0,
              maxStock: itemDto.maxStock ?? null,
              supplierId: itemDto.supplierId,
              trackBatch: itemDto.trackBatch ?? false,
              isActive: true,
            },
          });

          if ((itemDto.currentStock ?? 0) > 0) {
            await tx.stockLedger.create({
              data: {
                businessId,
                branchId,
                itemId: item.id,
                type: 'purchase',
                quantity: itemDto.currentStock!,
                previousStock: 0,
                newStock: itemDto.currentStock!,
                referenceType: 'adjustment',
                reason: 'Import opening stock',
                createdBy: userId,
              },
            });
          }
          createdItems.push(item);
        }
        return createdItems;
      },
      { timeout: 10000 },
    );

    this.logger.info({ businessId, count: results.length }, 'Imported items');

    return {
      success: true,
      message: `${results.length} items imported successfully`,
    };
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  // Matches Next.js PATCH /api/items/[id] — also handles stockAdjustment
  async update(
    businessId: string,
    branchId: string,
    id: string,
    dto: UpdateItemDto,
  ) {
    const existing = await this.prisma.item.findFirst({
      where: { id, businessId, branchId },
    });
    if (!existing) {
      throw new NotFoundException(`Item ${id} not found.`);
    }

    // Guard: duplicate SKU if changing
    if (dto.sku && dto.sku !== existing.sku) {
      const skuTaken = await this.prisma.item.findFirst({
        where: { businessId, branchId, sku: dto.sku, id: { not: id } },
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
        ...(dto.trackBatch !== undefined && { trackBatch: dto.trackBatch }),
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

  // ─── STOCK ADJUSTMENT ─────────────────────────────────────────────────────
  // Matches Next.js PATCH stockAdjustment logic — separated into its own endpoint
  async adjustStock(
    businessId: string,
    branchId: string,
    id: string,
    userId: string | null,
    dto: StockAdjustmentDto,
  ) {
    const item = await this.prisma.item.findFirst({
      where: { id, businessId, branchId },
    });
    if (!item) {
      throw new NotFoundException(`Item ${id} not found.`);
    }

    const previousStock = item.currentStock;
    const newStock = previousStock + dto.stockAdjustment;

    if (newStock < 0) {
      throw new BadRequestException(
        `Adjustment would result in negative stock (${newStock}).`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.item.update({
        where: { id },
        data: { currentStock: newStock },
        include: {
          category: { select: { id: true, name: true, nameBn: true } },
        },
      }),
      this.prisma.stockLedger.create({
        data: {
          businessId,
          itemId: id,
          type: dto.stockAdjustment > 0 ? 'purchase' : 'sale',
          quantity: Math.abs(dto.stockAdjustment),
          previousStock,
          newStock,
          referenceType: 'adjustment',
          reason: dto.adjustmentReason ?? 'Manual adjustment',
          createdBy: userId,
        },
      }),
    ]);

    this.logger.info(
      { itemId: id, businessId, previousStock, newStock },
      'Stock adjusted',
    );

    return {
      success: true,
      data: { ...updated, ...calcFields(updated) },
    };
  }

  // ─── STOCK TRANSFER ───────────────────────────────────────────────────────
  async transferStock(
    businessId: string,
    userId: string | null,
    dto: StockTransferDto,
  ) {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException(
        'Source and destination branches must be different.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const sourceItem = await tx.item.findFirst({
        where: { id: dto.itemId, businessId, branchId: dto.fromBranchId },
      });

      if (!sourceItem) {
        throw new NotFoundException(`Item not found in source branch.`);
      }

      if (sourceItem.currentStock < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${sourceItem.currentStock}`,
        );
      }

      let targetItem = await tx.item.findFirst({
        where: {
          businessId,
          branchId: dto.toBranchId,
          sku: sourceItem.sku,
          name: sourceItem.name,
        },
      });

      if (!targetItem) {
        targetItem = await tx.item.create({
          data: {
            businessId,
            branchId: dto.toBranchId,
            name: sourceItem.name,
            nameBn: sourceItem.nameBn,
            sku: sourceItem.sku,
            barcode: sourceItem.barcode,
            categoryId: sourceItem.categoryId,
            unit: sourceItem.unit,
            costPrice: sourceItem.costPrice,
            sellingPrice: sourceItem.sellingPrice,
            currentStock: 0,
            trackBatch: sourceItem.trackBatch,
            isActive: true,
          },
        });
      }

      const prevSourceStock = sourceItem.currentStock;
      const prevTargetStock = targetItem.currentStock;

      await tx.item.update({
        where: { id: sourceItem.id },
        data: { currentStock: prevSourceStock - dto.quantity },
      });

      await tx.stockLedger.create({
        data: {
          businessId,
          branchId: dto.fromBranchId,
          itemId: sourceItem.id,
          type: 'transfer_out',
          quantity: dto.quantity,
          previousStock: prevSourceStock,
          newStock: prevSourceStock - dto.quantity,
          toBranchId: dto.toBranchId,
          referenceType: 'transfer',
          notes: dto.notes,
          createdBy: userId,
        },
      });

      await tx.item.update({
        where: { id: targetItem.id },
        data: { currentStock: prevTargetStock + dto.quantity },
      });

      await tx.stockLedger.create({
        data: {
          businessId,
          branchId: dto.toBranchId,
          itemId: targetItem.id,
          type: 'transfer_in',
          quantity: dto.quantity,
          previousStock: prevTargetStock,
          newStock: prevTargetStock + dto.quantity,
          fromBranchId: dto.fromBranchId,
          referenceType: 'transfer',
          notes: dto.notes,
          createdBy: userId,
        },
      });
    });

    this.logger.info(
      { businessId, itemId: dto.itemId },
      'Stock transfer completed',
    );

    return {
      success: true,
      message: 'Stock transferred successfully',
    };
  }

  // ─── SOFT DELETE ───────────────────────────────────────────────────────────
  async remove(businessId: string, branchId: string, id: string) {
    const existing = await this.prisma.item.findFirst({
      where: { id, businessId, branchId },
    });
    if (!existing) {
      throw new NotFoundException(`Item ${id} not found.`);
    }

    await this.prisma.item.update({
      where: { id, businessId, branchId },
      data: { isActive: false },
    });

    this.logger.info({ itemId: id, businessId, branchId }, 'Item soft-deleted');

    return { success: true, data: { id } };
  }

  // ─── STOCK LEDGER (full history) ───────────────────────────────────────────
  async getStockLedger(businessId: string, branchId: string, itemId: string) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, businessId, branchId },
    });
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found.`);
    }

    const ledger = await this.prisma.stockLedger.findMany({
      where: { itemId, businessId, branchId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { success: true, data: ledger };
  }
  async getCategories(businessTypeId: string) {
    const categories = await this.prisma.category.findMany({
      where: { businessTypeId },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: categories,
    };
  }
}
