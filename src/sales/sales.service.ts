import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Prisma } from '@prisma/client';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto, SaleStatus } from './dto/update-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';

// ─── Prisma result types ──────────────────────────────────────────────────────
// These mirror the exact `include` shapes used in each query so the
// transformer functions are fully typed — no `any` anywhere.

const listSaleInclude = {
  items: {
    include: {
      item: { select: { id: true, name: true, sku: true } },
    },
  },
  party: { select: { id: true, name: true, phone: true, type: true } },
} satisfies Prisma.SaleInclude;

const singleSaleInclude = {
  items: {
    include: {
      item: {
        select: {
          id: true,
          name: true,
          nameBn: true,
          sku: true,
          barcode: true,
          unit: true,
          currentStock: true,
        },
      },
    },
  },
  party: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      type: true,
      customerTier: true,
      currentBalance: true,
      creditLimit: true,
    },
  },
} satisfies Prisma.SaleInclude;

type ListSale = Prisma.SaleGetPayload<{ include: typeof listSaleInclude }>;
type SingleSale = Prisma.SaleGetPayload<{ include: typeof singleSaleInclude }>;

// ─── Response transformers ────────────────────────────────────────────────────

function transformListSale(sale: ListSale) {
  return {
    ...sale,
    partyName: sale.party?.name ?? null,
    partyPhone: sale.party?.phone ?? null,
    items: sale.items.map((item) => ({
      id: item.id,
      saleId: item.saleId,
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      discount: item.discount,
      total: item.total,
      profit: item.profit,
      createdAt: item.createdAt,
      item: item.item,
    })),
  };
}

function transformSingleSale(sale: SingleSale) {
  return {
    ...sale,
    partyName: sale.party?.name ?? null,
    partyPhone: sale.party?.phone ?? null,
    items: sale.items.map((item) => ({
      id: item.id,
      saleId: item.saleId,
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      discount: item.discount,
      total: item.total,
      profit: item.profit,
      createdAt: item.createdAt,
      item: item.item,
    })),
  };
}

// ─── Invoice number generator ─────────────────────────────────────────────────

async function generateInvoiceNo(
  tx: Prisma.TransactionClient,
  businessId: string,
): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}-`;
  const last = await tx.sale.findFirst({
    where: { businessId, invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
  });
  const next = last ? parseInt(last.invoiceNo.slice(-4), 10) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

// ─── Account type map ─────────────────────────────────────────────────────────

const ACCOUNT_TYPE_MAP: Record<
  string,
  { type: string; name: string; nameBn: string }
> = {
  cash: { type: 'cash', name: 'Cash', nameBn: 'নগদ' },
  card: { type: 'bank', name: 'Bank', nameBn: 'ব্যাংক' },
  mobile_banking: {
    type: 'mobile_wallet',
    name: 'Mobile Wallet',
    nameBn: 'মোবাইল ওয়ালেট',
  },
  bank_transfer: { type: 'bank', name: 'Bank', nameBn: 'ব্যাংক' },
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(SalesService.name)
    private readonly logger: PinoLogger,
  ) {}

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async findAll(businessId: string, query: QuerySaleDto) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);

    const where: Prisma.SaleWhereInput = { businessId };

    if (query.partyId) where.partyId = query.partyId;

    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (query.search) {
      where.OR = [
        { invoiceNo: { contains: query.search, mode: 'insensitive' } },
        { party: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: listSaleInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      success: true,
      data: sales.map(transformListSale),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────────
  async findOne(businessId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, businessId },
      include: singleSaleInclude,
    });

    if (!sale) throw new NotFoundException(`Sale ${id} not found.`);

    return { success: true, data: transformSingleSale(sale) };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async create(businessId: string, userId: string | null, dto: CreateSaleDto) {
    const {
      partyId,
      items,
      discount = 0,
      tax = 0,
      paymentMethod,
      paidAmount = 0,
      pricingTier,
      notes,
    } = dto;

    // 1. Validate all items exist and belong to this business
    const itemIds = items.map((i) => i.itemId);
    const dbItems = await this.prisma.item.findMany({
      where: { id: { in: itemIds }, businessId },
    });

    if (dbItems.length !== itemIds.length) {
      const foundIds = new Set(dbItems.map((i) => i.id));
      const missing = itemIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Items not found: ${missing.join(', ')}`);
    }

    const itemMap = new Map(dbItems.map((i) => [i.id, i]));

    // 2. Validate stock and build sale items payload
    const saleItemsData = items.map((input) => {
      const dbItem = itemMap.get(input.itemId)!;

      if (dbItem.currentStock < input.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${dbItem.name}". Available: ${dbItem.currentStock}, Requested: ${input.quantity}`,
        );
      }

      const itemDiscount = input.discount ?? 0;
      const itemTotal = input.quantity * input.unitPrice - itemDiscount;
      const itemProfit =
        (input.unitPrice - dbItem.costPrice) * input.quantity - itemDiscount;

      return {
        // fields written to DB
        itemId: dbItem.id,
        itemName: input.itemName ?? dbItem.name,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        costPrice: dbItem.costPrice,
        discount: itemDiscount,
        total: itemTotal,
        profit: itemProfit,
        // helpers used for stock ledger — stripped before Prisma create
        _previousStock: dbItem.currentStock,
        _newStock: dbItem.currentStock - input.quantity,
      };
    });

    // 3. Compute sale totals
    const subtotal = saleItemsData.reduce((sum, i) => sum + i.total, 0);
    const totalProfit = saleItemsData.reduce((sum, i) => sum + i.profit, 0);
    const total = subtotal - discount + tax;
    const dueAmount = total - paidAmount;

    // 4. Run everything in a single transaction
    const sale = await this.prisma.$transaction(async (tx) => {
      const invoiceNo = await generateInvoiceNo(tx, businessId);

      const newSale = await tx.sale.create({
        data: {
          businessId,
          invoiceNo,
          partyId: partyId ?? null,
          subtotal,
          discount,
          tax,
          total,
          paidAmount,
          dueAmount,
          paymentMethod,
          pricingTier: pricingTier ?? null,
          status: dueAmount > 0 ? 'pending' : 'completed',
          profit: totalProfit,
          notes: notes ?? null,
          createdBy: userId,
          items: {
            // strip the underscore helper fields before writing
            create: saleItemsData.map((item) => ({
              itemId: item.itemId,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPrice: item.costPrice,
              discount: item.discount,
              total: item.total,
              profit: item.profit,
            })),
          },
        },
        include: listSaleInclude,
      });

      // Update stock + ledger for each item
      for (const itemData of saleItemsData) {
        await tx.item.update({
          where: { id: itemData.itemId },
          data: { currentStock: itemData._newStock, lastSaleDate: new Date() },
        });

        await tx.stockLedger.create({
          data: {
            businessId,
            itemId: itemData.itemId,
            type: 'sale',
            quantity: -itemData.quantity,
            previousStock: itemData._previousStock,
            newStock: itemData._newStock,
            referenceId: newSale.id,
            referenceType: 'sale',
            createdBy: userId,
          },
        });
      }

      // Party ledger entry for credit sales
      if (partyId && dueAmount > 0) {
        const party = await tx.party.findUnique({ where: { id: partyId } });
        if (party) {
          const newBalance = party.currentBalance + dueAmount;
          await tx.party.update({
            where: { id: partyId },
            data: { currentBalance: newBalance },
          });
          await tx.partyLedger.create({
            data: {
              businessId,
              partyId,
              type: 'sale',
              referenceId: newSale.id,
              referenceType: 'sale',
              amount: dueAmount,
              balance: newBalance,
              description: `Credit sale - Invoice ${invoiceNo}`,
              date: new Date(),
            },
          });
        }
      }

      // Update account balance for paid amount
      if (paidAmount > 0) {
        const accountMeta =
          ACCOUNT_TYPE_MAP[paymentMethod] ?? ACCOUNT_TYPE_MAP['cash'];

        let account = await tx.account.findFirst({
          where: { businessId, type: accountMeta.type },
        });

        if (!account) {
          account = await tx.account.create({
            data: {
              businessId,
              name: accountMeta.name,
              nameBn: accountMeta.nameBn,
              type: accountMeta.type,
              isDefault: true,
              status: 'active',
              currentBalance: 0,
            },
          });
        }

        await tx.account.update({
          where: { id: account.id },
          data: { currentBalance: account.currentBalance + paidAmount },
        });
      }

      return newSale;
    });

    this.logger.info(
      { saleId: sale.id, businessId, invoiceNo: sale.invoiceNo },
      'Sale created',
    );

    return { success: true, data: transformListSale(sale) };
  }

  // ─── UPDATE STATUS ─────────────────────────────────────────────────────────
  async update(
    businessId: string,
    id: string,
    userId: string | null,
    dto: UpdateSaleDto,
  ) {
    const existing = await this.prisma.sale.findFirst({
      where: { id, businessId },
      include: { items: true, party: true },
    });

    if (!existing) throw new NotFoundException(`Sale ${id} not found.`);

    // Cast Prisma's string status to the enum for safe comparisons
    const existingStatus = existing.status as SaleStatus;

    // Guard: can't modify already cancelled/returned
    if (
      existingStatus === SaleStatus.CANCELLED ||
      existingStatus === SaleStatus.RETURNED
    ) {
      throw new ForbiddenException(`Cannot update a ${existing.status} sale.`);
    }

    const { status, notes } = dto;

    const sale = await this.prisma.$transaction(async (tx) => {
      // Reverse stock + party ledger on cancel/return
      if (status === SaleStatus.CANCELLED || status === SaleStatus.RETURNED) {
        for (const saleItem of existing.items) {
          const item = await tx.item.findUnique({
            where: { id: saleItem.itemId },
          });
          if (!item) continue;

          const restoredStock = item.currentStock + saleItem.quantity;

          await tx.item.update({
            where: { id: saleItem.itemId },
            data: { currentStock: restoredStock },
          });

          await tx.stockLedger.create({
            data: {
              businessId,
              itemId: saleItem.itemId,
              type: status === SaleStatus.CANCELLED ? 'adjustment' : 'return',
              quantity: saleItem.quantity,
              previousStock: item.currentStock,
              newStock: restoredStock,
              referenceId: existing.id,
              referenceType: 'sale',
              reason:
                status === SaleStatus.CANCELLED
                  ? 'Sale cancelled'
                  : 'Sale returned',
              createdBy: userId,
            },
          });
        }

        // Reverse party ledger for credit sales
        if (existing.partyId && existing.dueAmount > 0) {
          const party = await tx.party.findUnique({
            where: { id: existing.partyId },
          });
          if (party) {
            const newBalance = party.currentBalance - existing.dueAmount;
            await tx.party.update({
              where: { id: existing.partyId },
              data: { currentBalance: newBalance },
            });
            await tx.partyLedger.create({
              data: {
                businessId,
                partyId: existing.partyId,
                type: 'adjustment',
                referenceId: existing.id,
                referenceType: 'sale',
                amount: -existing.dueAmount,
                balance: newBalance,
                description: `Sale ${status} - Invoice ${existing.invoiceNo}`,
                date: new Date(),
              },
            });
          }
        }
      }

      return tx.sale.update({
        where: { id },
        data: {
          ...(status !== undefined && { status }),
          ...(notes !== undefined && { notes: notes ?? null }),
        },
        include: listSaleInclude,
      });
    });

    this.logger.info({ saleId: id, businessId, status }, 'Sale updated');

    return { success: true, data: transformListSale(sale) };
  }
}
