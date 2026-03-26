import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

function getDaysUntilExpiry(expiryDate: Date | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  return Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getBatchStatus(batch: any): string {
  if (!batch.isActive) return 'inactive';
  if (batch.remainingQty <= 0) return 'depleted';
  const days = getDaysUntilExpiry(batch.expiryDate);
  if (days !== null) {
    if (days <= 0) return 'expired';
    if (days <= 30) return 'expiring';
  }
  return 'active';
}

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(BatchesService.name)
    private readonly logger: PinoLogger,
  ) {}

  async findAll(businessId: string, status?: string, expiryDays?: string) {
    const batches = await this.prisma.batch.findMany({
      where: { businessId, deletedAt: null },
      include: { item: { select: { name: true, sku: true } } },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
    });

    const enriched = batches.map(b => ({
      ...b,
      batchNo: b.batchNumber,
      itemName: b.item.name,
      sku: b.item.sku,
      status: getBatchStatus(b),
      daysUntilExpiry: getDaysUntilExpiry(b.expiryDate),
    }));

    let filtered = enriched;
    if (status && status !== 'all') {
      filtered = filtered.filter(b => b.status === status);
    }
    if (expiryDays) {
      const days = parseInt(expiryDays, 10);
      filtered = filtered.filter(b => b.daysUntilExpiry !== null && b.daysUntilExpiry <= days);
    }

    return { success: true, data: filtered };
  }

  async findAvailable(businessId: string, itemId: string, requestedQty?: number) {
    if (!itemId) {
        throw new NotFoundException('itemId is required');
    }

    const item = await this.prisma.item.findFirst({
        where: { id: itemId, businessId },
    });

    if (!item) {
        throw new NotFoundException(`Item not found`);
    }

    const batches = await this.prisma.batch.findMany({
      where: {
        itemId,
        businessId,
        remainingQty: { gt: 0 },
        isActive: true,
        deletedAt: null,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }]
    });

    const enriched = batches.map(b => ({
      ...b,
      batchNo: b.batchNumber,
      availableQty: b.remainingQty,
      daysUntilExpiry: getDaysUntilExpiry(b.expiryDate),
      urgency: this.getUrgency(b.expiryDate),
    }));

    let canFulfill = false;
    let shortage = 0;
    const suggestedAllocation: any[] = [];

    if (requestedQty && requestedQty > 0) {
      let remainingNeeded = requestedQty;
      for (const b of enriched) {
        if (remainingNeeded <= 0) break;
        const take = Math.min(b.availableQty, remainingNeeded);
        if (take > 0) {
          suggestedAllocation.push({
            batchId: b.id,
            batchNo: b.batchNo,
            quantity: take,
            costPrice: b.costPrice,
            expiryDate: b.expiryDate,
          });
          remainingNeeded -= take;
        }
      }
      canFulfill = remainingNeeded <= 0;
      shortage = remainingNeeded;
    }

    return {
      success: true,
      data: {
        item: {
            id: item.id,
            name: item.name,
            trackBatch: item.trackBatch,
            currentStock: item.currentStock,
        },
        batchTracking: item.trackBatch,
        totalAvailable: enriched.reduce((sum, b) => sum + b.availableQty, 0),
        batches: enriched,
        requestedQty,
        canFulfill,
        shortage,
        suggestedAllocation,
      }
    };
  }

  private getUrgency(expiryDate: Date | null) {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return 'normal';
    if (days <= 0) return 'expired';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'warning';
    return 'normal';
  }

  async getExpiryAlerts(businessId: string, thresholdDays = 30, includeExpired = false) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + thresholdDays);

    const conditions: any[] = [{ expiryDate: { lte: thresholdDate } }];
    if (!includeExpired) {
        conditions.push({ expiryDate: { gt: new Date() } });
    }

    const batches = await this.prisma.batch.findMany({
        where: {
            businessId,
            deletedAt: null,
            remainingQty: { gt: 0 },
            AND: conditions,
        },
        include: { item: { select: { name: true, sku: true } } },
        orderBy: { expiryDate: 'asc' },
    });

    const alerts = batches.map(b => {
        const days = getDaysUntilExpiry(b.expiryDate)!;
        return {
            id: b.id,
            batchNo: b.batchNumber,
            itemId: b.itemId,
            itemName: b.item.name,
            remainingQty: b.remainingQty,
            expiryDate: b.expiryDate,
            daysUntilExpiry: days,
            urgency: this.getUrgency(b.expiryDate),
            message: days > 0 ? `Expires in ${days} days` : 'Expired',
            stockValue: b.remainingQty * b.costPrice,
        };
    });

    const summary = {
        total: alerts.length,
        critical: alerts.filter(a => a.urgency === 'critical').length,
        warning: alerts.filter(a => a.urgency === 'warning').length,
        expired: alerts.filter(a => a.urgency === 'expired').length,
        totalStockValue: alerts.reduce((sum, a) => sum + a.stockValue, 0),
    };

    return {
        success: true,
        data: {
            alerts,
            summary,
            threshold: thresholdDays,
            generatedAt: new Date(),
        }
    };
  }

  async create(businessId: string, dto: any) {
    const item = await this.prisma.item.findFirst({
        where: { id: dto.itemId, businessId }
    });
    if (!item) throw new NotFoundException('Item not found');

    const batch = await this.prisma.batch.create({
        data: {
            businessId,
            itemId: dto.itemId,
            batchNumber: dto.batchNumber,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            manufactureDate: dto.manufactureDate ? new Date(dto.manufactureDate) : null,
            quantity: dto.quantity || 0,
            remainingQty: dto.quantity || 0,
            costPrice: dto.costPrice || 0,
            mrp: dto.mrp || null,
            location: dto.location || null,
        }
    });

    return { success: true, data: batch };
  }

  async findOne(businessId: string, id: string) {
      const batch = await this.prisma.batch.findFirst({
        where: { id, businessId, deletedAt: null },
        include: { item: true }
      });
      if (!batch) throw new NotFoundException('Batch not found');

      return {
          success: true,
          data: {
              ...batch,
              batchNo: batch.batchNumber,
              status: getBatchStatus(batch),
              daysUntilExpiry: getDaysUntilExpiry(batch.expiryDate),
          }
      };
  }
}
