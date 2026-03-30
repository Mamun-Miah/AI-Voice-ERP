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
import { EditSaleDto } from './dto/edit-sale.dto';
import { UpdateSaleDto, SaleStatus } from './dto/update-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';

// ─── Prisma result types ──────────────────────────────────────────────────────

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
  async findAll(businessId: string, branchId: string, query: QuerySaleDto) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);

    const where: Prisma.SaleWhereInput = { businessId, branchId };

    if (query.partyId) where.partyId = query.partyId;

    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
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
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────────
  async findOne(businessId: string, branchId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, businessId, branchId },
      include: singleSaleInclude,
    });

    if (!sale) throw new NotFoundException(`Sale ${id} not found.`);

    return { success: true, data: transformSingleSale(sale) };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async create(
    businessId: string,
    branchId: string,
    userId: string | null,
    dto: CreateSaleDto,
  ) {
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

    const sale = await this.prisma.$transaction(async (tx) => {
      const invoiceNo = await generateInvoiceNo(tx, businessId);

      const saleItemsData: any[] = [];
      let subtotal = 0;
      let totalProfit = 0;

      for (const input of items) {
        const dbItem = await tx.item.findUnique({ where: { id: input.itemId } });
        if (!dbItem) throw new BadRequestException(`Item not found: ${input.itemId}`);
        
        if (dbItem.currentStock < input.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${dbItem.name}". Available: ${dbItem.currentStock}, Requested: ${input.quantity}`,
          );
        }

        const itemDiscount = input.discount ?? 0;
        let qtyToFulfill = input.quantity;

        if (dbItem.trackBatch) {
          const batches = await tx.batch.findMany({
            where: {
              itemId: dbItem.id,
              businessId,
              isActive: true,
              remainingQty: { gt: 0 },
              ...(input.batchId ? { id: input.batchId } : {})
            },
            orderBy: { expiryDate: 'asc' }
          });

          for (const batch of batches) {
            if (qtyToFulfill <= 0) break;
            
            const allocateQty = Math.min(qtyToFulfill, batch.remainingQty);
            qtyToFulfill -= allocateQty;
            
            const allocatedDiscount = (itemDiscount / input.quantity) * allocateQty;
            const allocatedTotal = allocateQty * input.unitPrice - allocatedDiscount;
            const allocatedProfit = (input.unitPrice - batch.costPrice) * allocateQty - allocatedDiscount;

            saleItemsData.push({
              itemId: dbItem.id,
              batchId: batch.id,
              itemName: input.itemName ?? dbItem.name,
              quantity: allocateQty,
              unitPrice: input.unitPrice,
              costPrice: batch.costPrice,
              discount: allocatedDiscount,
              total: allocatedTotal,
              profit: allocatedProfit,
            });

            await tx.batch.update({
              where: { id: batch.id },
              data: { remainingQty: batch.remainingQty - allocateQty }
            });
          }

          if (qtyToFulfill > 0) {
            throw new BadRequestException(`Insufficient batch stock for "${dbItem.name}". Missing ${qtyToFulfill} units.`);
          }
        } else {
          const itemTotal = input.quantity * input.unitPrice - itemDiscount;
          const itemProfit = (input.unitPrice - dbItem.costPrice) * input.quantity - itemDiscount;
          
          saleItemsData.push({
            itemId: dbItem.id,
            batchId: null,
            itemName: input.itemName ?? dbItem.name,
            quantity: input.quantity,
            unitPrice: input.unitPrice,
            costPrice: dbItem.costPrice,
            discount: itemDiscount,
            total: itemTotal,
            profit: itemProfit,
          });
        }
      }

      subtotal = saleItemsData.reduce((sum, i) => sum + i.total, 0);
      totalProfit = saleItemsData.reduce((sum, i) => sum + i.profit, 0);
      const total = subtotal - discount + tax;
      const dueAmount = total - paidAmount;

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
            create: saleItemsData.map((item) => ({
              itemId: item.itemId,
              batchId: item.batchId,
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

      for (const itemData of saleItemsData) {
        const currentItem = await tx.item.findUnique({ where: { id: itemData.itemId } });
        const prevStock = currentItem!.currentStock;
        const newStock = prevStock - itemData.quantity;

        await tx.item.update({
          where: { id: itemData.itemId },
          data: { currentStock: newStock, lastSaleDate: new Date() },
        });

        await tx.stockLedger.create({
          data: {
            businessId,
            itemId: itemData.itemId,
            batchId: itemData.batchId,
            type: 'sale',
            quantity: -itemData.quantity,
            previousStock: prevStock,
            newStock: newStock,
            referenceId: newSale.id,
            referenceType: 'sale',
            createdBy: userId,
          },
        });
      }

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

      if (paidAmount > 0) {
        const accountMeta = ACCOUNT_TYPE_MAP[paymentMethod] ?? ACCOUNT_TYPE_MAP['cash'];
        let account = await tx.account.findFirst({
          where: { businessId, branchId, type: accountMeta.type },
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
    branchId: string,
    id: string,
    userId: string | null,
    dto: UpdateSaleDto,
  ) {
    const existing = await this.prisma.sale.findFirst({
      where: { id, businessId, branchId },
      include: { items: true, party: true },
    });

    if (!existing) throw new NotFoundException(`Sale ${id} not found.`);

    const existingStatus = existing.status as SaleStatus;
    if (
      existingStatus === SaleStatus.CANCELLED ||
      existingStatus === SaleStatus.RETURNED
    ) {
      throw new ForbiddenException(`Cannot update a ${existing.status} sale.`);
    }

    const { status, notes } = dto;

    const sale = await this.prisma.$transaction(async (tx) => {
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
          if (saleItem.batchId) {
            await tx.batch.update({
              where: { id: saleItem.batchId },
              data: { remainingQty: { increment: saleItem.quantity } },
            });
          }
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

    this.logger.info(
      { saleId: id, businessId, branchId, status },
      'Sale status updated',
    );
    return { success: true, data: transformListSale(sale) };
  }

  // ─── EDIT SALE ─────────────────────────────────────────────────────────────
  // Replaces items entirely and recalculates all totals.
  // Strategy:
  //   1. Restore stock from old items
  //   2. Validate + deduct stock for new items
  //   3. Delete old SaleItems, insert new ones
  //   4. Recalculate Sale totals
  //   5. Reconcile party ledger for the due-amount diff
  async editSale(
    businessId: string,
    branchId: string,
    id: string,
    userId: string | null,
    dto: EditSaleDto,
  ) {
    const existing = await this.prisma.sale.findFirst({
      where: { id, businessId, branchId },
      include: { items: true },
    });

    if (!existing) throw new NotFoundException(`Sale ${id} not found.`);

    const existingStatus = existing.status as SaleStatus;
    if (
      existingStatus === SaleStatus.CANCELLED ||
      existingStatus === SaleStatus.RETURNED
    ) {
      throw new ForbiddenException(`Cannot edit a ${existing.status} sale.`);
    }

    const newPartyId = dto.partyId !== undefined ? dto.partyId : existing.partyId;
    const newDiscount = dto.discount !== undefined ? dto.discount : existing.discount;
    const newTax = dto.tax !== undefined ? dto.tax : existing.tax;
    const newPaymentMethod = dto.paymentMethod !== undefined ? dto.paymentMethod : existing.paymentMethod;
    const newPaidAmount = dto.paidAmount !== undefined ? dto.paidAmount : existing.paidAmount;
    const newPricingTier = dto.pricingTier !== undefined ? dto.pricingTier : existing.pricingTier;
    const newNotes = dto.notes !== undefined ? dto.notes : existing.notes;

    const sale = await this.prisma.$transaction(async (tx) => {
      const saleItemsData: any[] = [];
      let newSubtotal = existing.subtotal;
      let newTotalProfit = existing.profit;

      if (dto.items && dto.items.length > 0) {
        // Restore old items
        for (const oldItem of existing.items) {
          const dbItem = await tx.item.findUnique({
            where: { id: oldItem.itemId },
          });
          if (!dbItem) continue;
          const restoredStock = dbItem.currentStock + oldItem.quantity;
          await tx.item.update({
            where: { id: oldItem.itemId },
            data: { currentStock: restoredStock },
          });
          
          if (oldItem.batchId) {
            await tx.batch.update({
              where: { id: oldItem.batchId },
              data: { remainingQty: { increment: oldItem.quantity } },
            });
          }

          await tx.stockLedger.create({
            data: {
              businessId,
              itemId: oldItem.itemId,
              batchId: oldItem.batchId,
              type: 'adjustment',
              quantity: oldItem.quantity,
              previousStock: dbItem.currentStock,
              newStock: restoredStock,
              referenceId: existing.id,
              referenceType: 'sale',
              reason: 'Sale edited — old items reversed',
              createdBy: userId,
            },
          });
        }
        await tx.saleItem.deleteMany({ where: { saleId: id } });

        // Process new items
        for (const input of dto.items) {
          const dbItem = await tx.item.findUnique({ where: { id: input.itemId } });
          if (!dbItem) throw new BadRequestException(`Item not found: ${input.itemId}`);
          
          if (dbItem.currentStock < input.quantity) {
            throw new BadRequestException(
              `Insufficient stock for "${dbItem.name}". Available: ${dbItem.currentStock}, Requested: ${input.quantity}`,
            );
          }

          const itemDiscount = input.discount ?? 0;
          let qtyToFulfill = input.quantity;

          if (dbItem.trackBatch) {
            const batches = await tx.batch.findMany({
              where: {
                itemId: dbItem.id,
                businessId,
                isActive: true,
                remainingQty: { gt: 0 }
              },
              orderBy: { expiryDate: 'asc' }
            });

            for (const batch of batches) {
              if (qtyToFulfill <= 0) break;
              
              const allocateQty = Math.min(qtyToFulfill, batch.remainingQty);
              qtyToFulfill -= allocateQty;
              
              const allocatedDiscount = (itemDiscount / input.quantity) * allocateQty;
              const allocatedTotal = allocateQty * input.unitPrice - allocatedDiscount;
              const allocatedProfit = (input.unitPrice - batch.costPrice) * allocateQty - allocatedDiscount;

              saleItemsData.push({
                itemId: dbItem.id,
                batchId: batch.id,
                itemName: input.itemName ?? dbItem.name,
                quantity: allocateQty,
                unitPrice: input.unitPrice,
                costPrice: batch.costPrice,
                discount: allocatedDiscount,
                total: allocatedTotal,
                profit: allocatedProfit,
              });

              await tx.batch.update({
                where: { id: batch.id },
                data: { remainingQty: batch.remainingQty - allocateQty }
              });
            }

            if (qtyToFulfill > 0) {
              throw new BadRequestException(`Insufficient batch stock for "${dbItem.name}". Missing ${qtyToFulfill} units.`);
            }
          } else {
            const itemTotal = input.quantity * input.unitPrice - itemDiscount;
            const itemProfit = (input.unitPrice - dbItem.costPrice) * input.quantity - itemDiscount;
            
            saleItemsData.push({
              itemId: dbItem.id,
              batchId: null,
              itemName: input.itemName ?? dbItem.name,
              quantity: input.quantity,
              unitPrice: input.unitPrice,
              costPrice: dbItem.costPrice,
              discount: itemDiscount,
              total: itemTotal,
              profit: itemProfit,
            });
          }
        }

        // Apply new items
        for (const itemData of saleItemsData) {
          await tx.saleItem.create({
            data: {
              saleId: id,
              itemId: itemData.itemId,
              batchId: itemData.batchId,
              itemName: itemData.itemName,
              quantity: itemData.quantity,
              unitPrice: itemData.unitPrice,
              costPrice: itemData.costPrice,
              discount: itemData.discount,
              total: itemData.total,
              profit: itemData.profit,
            },
          });

          const currentItem = await tx.item.findUnique({ where: { id: itemData.itemId } });
          const prevStock = currentItem!.currentStock;
          const newStock = prevStock - itemData.quantity;

          await tx.item.update({
            where: { id: itemData.itemId },
            data: {
              currentStock: newStock,
              lastSaleDate: new Date(),
            },
          });
          
          await tx.stockLedger.create({
            data: {
              businessId,
              itemId: itemData.itemId,
              batchId: itemData.batchId,
              type: 'sale',
              quantity: -itemData.quantity,
              previousStock: prevStock,
              newStock: newStock,
              referenceId: id,
              referenceType: 'sale',
              reason: 'Sale edited — new items applied',
              createdBy: userId,
            },
          });
        }
        
        newSubtotal = saleItemsData.reduce((sum, i) => sum + i.total, 0);
        newTotalProfit = saleItemsData.reduce((sum, i) => sum + i.profit, 0);
      }

      const newTotal = newSubtotal - newDiscount + newTax;
      const newDueAmount = newTotal - newPaidAmount;

      if (newPartyId) {
        const dueDiff = newDueAmount - existing.dueAmount;
        if (dueDiff !== 0) {
          const party = await tx.party.findUnique({
            where: { id: newPartyId },
          });
          if (party) {
            const newBalance = party.currentBalance + dueDiff;
            await tx.party.update({
              where: { id: newPartyId },
              data: { currentBalance: newBalance },
            });
            await tx.partyLedger.create({
              data: {
                businessId,
                partyId: newPartyId,
                type: 'adjustment',
                referenceId: id,
                referenceType: 'sale',
                amount: dueDiff,
                balance: newBalance,
                description: `Sale edited - Invoice ${existing.invoiceNo}`,
                date: new Date(),
              },
            });
          }
        }
      }

      return tx.sale.update({
        where: { id },
        data: {
          partyId: newPartyId,
          subtotal: newSubtotal,
          discount: newDiscount,
          tax: newTax,
          total: newTotal,
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          paymentMethod: newPaymentMethod,
          pricingTier: newPricingTier ?? null,
          profit: newTotalProfit,
          notes: newNotes ?? null,
          status: newDueAmount > 0 ? 'pending' : 'completed',
        },
        include: listSaleInclude,
      });
    });

    this.logger.info({ saleId: id, businessId, branchId }, 'Sale edited');
    return { success: true, data: transformListSale(sale) };
  }

  // ─── DELETE (soft) ─────────────────────────────────────────────────────────
  // Marks sale as cancelled, restores stock, reverses party ledger.
  async remove(
    businessId: string,
    branchId: string,
    id: string,
    userId: string | null,
  ) {
    const existing = await this.prisma.sale.findFirst({
      where: { id, businessId, branchId },
      include: { items: true },
    });

    if (!existing) throw new NotFoundException(`Sale ${id} not found.`);

    const existingStatus = existing.status as SaleStatus;
    if (
      existingStatus === SaleStatus.CANCELLED ||
      existingStatus === SaleStatus.RETURNED
    ) {
      throw new ForbiddenException(
        `Sale is already ${existing.status} and cannot be deleted.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Restore stock for each item
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
          if (saleItem.batchId) {
            await tx.batch.update({
              where: { id: saleItem.batchId },
              data: { remainingQty: { increment: saleItem.quantity } },
            });
          }
        await tx.stockLedger.create({
          data: {
            businessId,
            itemId: saleItem.itemId,
            type: 'adjustment',
            quantity: saleItem.quantity,
            previousStock: item.currentStock,
            newStock: restoredStock,
            referenceId: existing.id,
            referenceType: 'sale',
            reason: 'Sale deleted',
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
              description: `Sale deleted - Invoice ${existing.invoiceNo}`,
              date: new Date(),
            },
          });
        }
      }

      await tx.sale.update({
        where: { id },
        data: { status: SaleStatus.CANCELLED },
      });
    });

    this.logger.info({ saleId: id, businessId }, 'Sale deleted (soft)');
    return { success: true, data: { id } };
  }

  // ─── SUMMARY / DASHBOARD STATS ────────────────────────────────────────────
  // GET /sales/summary
  // Returns today, this month, last month, all-time stats plus change % for UI.
  async getSummary(businessId: string, branchId: string) {
    const now = new Date();

    // ── Time range boundaries ──────────────────────────────────────────────
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 86_400_000); // +1 day

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = monthStart;

    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
    const yesterdayEnd = todayStart;

    // ── Shared where clause builder ────────────────────────────────────────
    const makeWhere = (from: Date, to: Date): Prisma.SaleWhereInput => ({
      businessId,
      branchId,
      status: { notIn: ['cancelled', 'returned'] },
      createdAt: { gte: from, lt: to },
    });

    // ── Run all aggregations in parallel ──────────────────────────────────
    const [
      todayAgg,
      yesterdayAgg,
      monthAgg,
      lastMonthAgg,
      allTimeAgg,
      todayCount,
      monthCount,
      allTimeCount,
    ] = await Promise.all([
      // Revenue aggregations
      this.prisma.sale.aggregate({
        where: makeWhere(todayStart, todayEnd),
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: makeWhere(yesterdayStart, yesterdayEnd),
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: makeWhere(monthStart, monthEnd),
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: makeWhere(lastMonthStart, lastMonthEnd),
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: {
          businessId,
          branchId,
          status: { notIn: ['cancelled', 'returned'] },
        },
        _sum: { total: true, profit: true },
        _avg: { total: true },
      }),
      // Count aggregations
      this.prisma.sale.count({ where: makeWhere(todayStart, todayEnd) }),
      this.prisma.sale.count({ where: makeWhere(monthStart, monthEnd) }),
      this.prisma.sale.count({
        where: {
          businessId,
          branchId,
          status: { notIn: ['cancelled', 'returned'] },
        },
      }),
    ]);

    // ── Change % helper ────────────────────────────────────────────────────
    function pctChange(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    }

    const todayTotal = todayAgg._sum.total ?? 0;
    const yesterdayTotal = yesterdayAgg._sum.total ?? 0;
    const monthTotal = monthAgg._sum.total ?? 0;
    const lastMonthTotal = lastMonthAgg._sum.total ?? 0;
    const allTimeTotal = allTimeAgg._sum.total ?? 0;
    const allTimeProfit = allTimeAgg._sum.profit ?? 0;
    const monthAvg = monthAgg._avg.total ?? 0;
    const lastMonthAvg = lastMonthAgg._avg.total ?? 0;
    const allTimeAvg = allTimeAgg._avg.total ?? 0;

    return {
      success: true,
      data: {
        today: {
          label: "Today's Sales",
          total: todayTotal,
          count: todayCount,
          change: pctChange(todayTotal, yesterdayTotal),
          changeLabel: 'vs Yesterday',
        },
        thisMonth: {
          label: 'This Month',
          total: monthTotal,
          count: monthCount,
          avgSale: monthAvg,
          change: pctChange(monthTotal, lastMonthTotal),
          changeLabel: 'vs Last Month',
          avgChange: pctChange(monthAvg, lastMonthAvg),
        },
        allTime: {
          label: 'Total Sales',
          total: allTimeTotal,
          profit: allTimeProfit,
          count: allTimeCount,
          avgSale: allTimeAvg,
        },
      },
    };
  }
}
