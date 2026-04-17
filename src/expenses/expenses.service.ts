import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Prisma } from '@prisma/client';
import { CreateExpenseDto } from './dto/create-expenses.dto';
import { UpdateExpenseDto } from './dto/update-expenses.dto';
import { QueryExpenseDto } from './dto/query-expenses.dto';
import { CreateExpenseCategoryDto } from './dto/create-expenses-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expenses-category.dto';

// ─── Prisma include shape ─────────────────────────────────────────────────────

const expenseInclude = {
  category: {
    select: { id: true, name: true, nameBn: true, icon: true, color: true },
  },
} satisfies Prisma.ExpenseInclude;

type ExpenseWithCategory = Prisma.ExpenseGetPayload<{
  include: typeof expenseInclude;
}>;

// ─── Account deduction helper ─────────────────────────────────────────────────

async function deductFromAccount(
  tx: Prisma.TransactionClient,
  businessId: string,
  branchId: string,
  accountId: string | undefined | null,
  amount: number,
): Promise<void> {
  if (accountId) {
    const account = await tx.account.findUnique({ where: { id: accountId } });
    if (account) {
      await tx.account.update({
        where: { id: accountId },
        data: { currentBalance: account.currentBalance - amount },
      });
    }
  } else {
    const cashAccount = await tx.account.findFirst({
      where: { businessId, branchId, type: 'cash' },
    });
    if (cashAccount) {
      await tx.account.update({
        where: { id: cashAccount.id },
        data: { currentBalance: cashAccount.currentBalance - amount },
      });
    }
  }
}

// ─── Account refund helper (reversal) ────────────────────────────────────────

async function refundToAccount(
  tx: Prisma.TransactionClient,
  businessId: string,
  branchId: string,
  accountId: string | undefined | null,
  amount: number,
): Promise<void> {
  if (accountId) {
    const account = await tx.account.findUnique({ where: { id: accountId } });
    if (account) {
      await tx.account.update({
        where: { id: accountId },
        data: { currentBalance: account.currentBalance + amount },
      });
    }
  } else {
    const cashAccount = await tx.account.findFirst({
      where: { businessId, branchId, type: 'cash' },
    });
    if (cashAccount) {
      await tx.account.update({
        where: { id: cashAccount.id },
        data: { currentBalance: cashAccount.currentBalance + amount },
      });
    }
  }
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(ExpensesService.name)
    private readonly logger: PinoLogger,
  ) { }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPENSES
  // ══════════════════════════════════════════════════════════════════════════

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async findAll(businessId: string, branchId: string, query: QueryExpenseDto) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '50', 10);

    const where: Prisma.ExpenseWhereInput = { businessId, branchId };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.branchId) where.branchId = query.branchId;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [expenses, total, totals] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: expenseInclude,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
      this.prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      success: true,
      data: expenses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        totalAmount: totals._sum.amount ?? 0,
      },
    };
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────────
  async findOne(
    businessId: string,
    branchId: string,
    id: string,
  ): Promise<{ success: boolean; data: ExpenseWithCategory }> {
    const expense = await this.prisma.expense.findFirst({
      where: { id, businessId, branchId },
      include: expenseInclude,
    });

    if (!expense) throw new NotFoundException(`Expense ${id} not found.`);

    return { success: true, data: expense };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async create(
    businessId: string,
    branchId: string,
    userId: string | null,
    dto: CreateExpenseDto,
  ) {
    // Verify category belongs to this business or is a global template (null businessId)
    const category = await this.prisma.expenseCategory.findFirst({
      where: {
        id: dto.categoryId,
        OR: [{ businessId }, { businessId: null }],
      },
    });

    if (!category) {
      throw new BadRequestException('Expense category not found.');
    }

    const expense = await this.prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          businessId,
          categoryId: dto.categoryId,
          accountId: dto.accountId,
          branchId,
          amount: dto.amount,
          description: dto.description,
          date: dto.date ? new Date(dto.date) : new Date(),
          receipt: dto.receipt,
          createdBy: userId,
        },
        include: expenseInclude,
      });

      await deductFromAccount(
        tx,
        businessId,
        branchId,
        dto.accountId,
        dto.amount,
      );

      return newExpense;
    });

    this.logger.info(
      { expenseId: expense.id, businessId, branchId },
      'Expense created',
    );
    return { success: true, data: expense };
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  // When amount changes: refund old amount → deduct new amount from account.
  async update(
    businessId: string,
    branchId: string,
    id: string,
    dto: UpdateExpenseDto,
  ) {
    const existing = await this.prisma.expense.findFirst({
      where: { id, businessId, branchId },
    });

    if (!existing) throw new NotFoundException(`Expense ${id} not found.`);

    // Validate new category if supplied
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.prisma.expenseCategory.findFirst({
        where: {
          id: dto.categoryId,
          OR: [{ businessId }, { businessId: null }],
        },
      });
      if (!category)
        throw new BadRequestException('Expense category not found.');
    }

    const expense = await this.prisma.$transaction(async (tx) => {
      // Reconcile account balance when amount changes
      if (dto.amount !== undefined && dto.amount !== existing.amount) {
        // Refund old amount
        await refundToAccount(
          tx,
          businessId,
          branchId,
          existing.accountId,
          existing.amount,
        );
        // Deduct new amount
        await deductFromAccount(
          tx,
          businessId,
          branchId,
          dto.accountId ?? existing.accountId,
          dto.amount,
        );
      }

      // If accountId changed but amount didn't, move the balance between accounts
      if (
        dto.accountId !== undefined &&
        dto.accountId !== existing.accountId &&
        dto.amount === undefined
      ) {
        await refundToAccount(
          tx,
          businessId,
          branchId,
          existing.accountId,
          existing.amount,
        );
        await deductFromAccount(
          tx,
          businessId,
          branchId,
          dto.accountId,
          existing.amount,
        );
      }

      return tx.expense.update({
        where: { id },
        data: {
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.accountId !== undefined && { accountId: dto.accountId }),
          ...(dto.branchId !== undefined && { branchId: dto.branchId }),
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.date !== undefined && { date: new Date(dto.date) }),
          ...(dto.receipt !== undefined && { receipt: dto.receipt }),
        },
        include: expenseInclude,
      });
    });

    this.logger.info(
      { expenseId: id, businessId, branchId },
      'Expense updated',
    );
    return { success: true, data: expense };
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────
  // Hard delete — refunds the amount back to the account.
  async remove(businessId: string, branchId: string, id: string) {
    const existing = await this.prisma.expense.findFirst({
      where: { id, businessId, branchId },
    });

    if (!existing) throw new NotFoundException(`Expense ${id} not found.`);

    await this.prisma.$transaction(async (tx) => {
      // Refund amount back to the account
      await refundToAccount(
        tx,
        businessId,
        branchId,
        existing.accountId,
        existing.amount,
      );

      await tx.expense.delete({ where: { id } });
    });

    this.logger.info(
      { expenseId: id, businessId, branchId },
      'Expense deleted',
    );
    return { success: true, data: { id } };
  }

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  async getSummary(businessId: string, branchId: string) {
    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 86_400_000);
    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
    const yesterdayEnd = todayStart;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = monthStart;

    const makeWhere = (from: Date, to: Date): Prisma.ExpenseWhereInput => ({
      businessId,
      date: { gte: from, lt: to },
    });

    const [
      todayAgg,
      yesterdayAgg,
      monthAgg,
      lastMonthAgg,
      allTimeAgg,
      todayCount,
      monthCount,
      allTimeCount,
      topCategories,
    ] = await Promise.all([
      this.prisma.expense.aggregate({
        where: makeWhere(todayStart, todayEnd),
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: makeWhere(yesterdayStart, yesterdayEnd),
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: makeWhere(monthStart, monthEnd),
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: makeWhere(lastMonthStart, lastMonthEnd),
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { businessId, branchId },
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      this.prisma.expense.count({ where: makeWhere(todayStart, todayEnd) }),
      this.prisma.expense.count({ where: makeWhere(monthStart, monthEnd) }),
      this.prisma.expense.count({ where: { businessId, branchId } }),
      // Top 5 categories by total spend this month
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: makeWhere(monthStart, monthEnd),
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
    ]);

    // Enrich top categories with names
    const categoryIds = topCategories.map((c) => c.categoryId);
    const categoryDetails = await this.prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, nameBn: true, icon: true, color: true },
    });
    const catMap = new Map(categoryDetails.map((c) => [c.id, c]));

    const topCategoriesWithDetails = topCategories.map((c) => ({
      ...catMap.get(c.categoryId),
      total: c._sum.amount ?? 0,
    }));

    function pctChange(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    }

    const todayTotal = todayAgg._sum.amount ?? 0;
    const yesterdayTotal = yesterdayAgg._sum.amount ?? 0;
    const monthTotal = monthAgg._sum.amount ?? 0;
    const lastMonthTotal = lastMonthAgg._sum.amount ?? 0;
    const allTimeTotal = allTimeAgg._sum.amount ?? 0;
    const monthAvg = monthAgg._avg.amount ?? 0;
    const lastMonthAvg = lastMonthAgg._avg.amount ?? 0;
    const allTimeAvg = allTimeAgg._avg.amount ?? 0;

    return {
      success: true,
      data: {
        today: {
          label: "Today's Expenses",
          total: todayTotal,
          count: todayCount,
          change: pctChange(todayTotal, yesterdayTotal),
          changeLabel: 'vs Yesterday',
        },
        thisMonth: {
          label: 'This Month',
          total: monthTotal,
          count: monthCount,
          avgExpense: monthAvg,
          change: pctChange(monthTotal, lastMonthTotal),
          changeLabel: 'vs Last Month',
          avgChange: pctChange(monthAvg, lastMonthAvg),
        },
        allTime: {
          label: 'Total Expenses',
          total: allTimeTotal,
          count: allTimeCount,
          avgExpense: allTimeAvg,
        },
        topCategories: topCategoriesWithDetails,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPENSE CATEGORIES
  // ══════════════════════════════════════════════════════════════════════════

  // ─── LIST CATEGORIES ───────────────────────────────────────────────────────
  // Returns business-specific categories + global templates (businessId = null)
  async findAllCategories() {
    const categories = await this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: categories };
  }

  // ─── GET ONE CATEGORY ──────────────────────────────────────────────────────
  async findOneCategory(businessId: string, id: string) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, OR: [{ businessId }, { businessId: null }] },
    });

    if (!category)
      throw new NotFoundException(`Expense category ${id} not found.`);

    return { success: true, data: category };
  }

  // ─── CREATE CATEGORY ───────────────────────────────────────────────────────
  async createCategory(businessId: string, dto: CreateExpenseCategoryDto) {
    // @@unique([businessId, name]) handles duplicates — but give a clear error
    const existing = await this.prisma.expenseCategory.findFirst({
      where: { businessId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists.`);
    }

    const category = await this.prisma.expenseCategory.create({
      data: {
        businessId,
        name: dto.name,
        nameBn: dto.nameBn,
        icon: dto.icon,
        color: dto.color,
        isDefault: false,
      },
    });

    this.logger.info(
      { categoryId: category.id, businessId },
      'Expense category created',
    );
    return { success: true, data: category };
  }

  // ─── UPDATE CATEGORY ───────────────────────────────────────────────────────
  async updateCategory(
    businessId: string,
    id: string,
    dto: UpdateExpenseCategoryDto,
  ) {
    const existing = await this.prisma.expenseCategory.findFirst({
      where: { id, businessId }, // only own categories are editable
    });

    if (!existing)
      throw new NotFoundException(`Expense category ${id} not found.`);

    // Check name uniqueness if renaming
    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.prisma.expenseCategory.findFirst({
        where: { businessId, name: dto.name, id: { not: id } },
      });
      if (nameTaken)
        throw new ConflictException(`Category "${dto.name}" already exists.`);
    }

    const category = await this.prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameBn !== undefined && { nameBn: dto.nameBn }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });

    return { success: true, data: category };
  }

  // ─── DELETE CATEGORY ───────────────────────────────────────────────────────
  async removeCategory(businessId: string, id: string) {
    const existing = await this.prisma.expenseCategory.findFirst({
      where: { id, businessId },
    });

    if (!existing)
      throw new NotFoundException(`Expense category ${id} not found.`);

    // Guard: don't delete if expenses are using this category
    const usageCount = await this.prisma.expense.count({
      where: { categoryId: id },
    });
    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${usageCount} existing expense(s). Reassign them first.`,
      );
    }

    await this.prisma.expenseCategory.delete({ where: { id } });

    this.logger.info(
      { categoryId: id, businessId },
      'Expense category deleted',
    );
    return { success: true, data: { id } };
  }
}
