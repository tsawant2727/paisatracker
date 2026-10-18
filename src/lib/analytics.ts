import { and, eq, gte, lte, sql, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts, budgets, categories, transactions } from "@/db/schema";
import { currentMonth, daysRemainingInMonth, monthRange } from "@/lib/dates";

export type TxRow = typeof transactions.$inferSelect & {
  categoryName?: string | null;
  categoryIcon?: string | null;
  accountName?: string;
};

function isTransfer(tx: { transferGroupId: string | null }) {
  return tx.transferGroupId != null;
}

export async function getAccountBalances(userId: string) {
  const db = await getDb();
  const accts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(accounts.sortOrder);

  const rows = await db
    .select({
      accountId: transactions.accountId,
      delta: sql<number>`SUM(CASE WHEN ${transactions.direction} = 'IN' THEN ${transactions.amountPaise} ELSE -${transactions.amountPaise} END)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .groupBy(transactions.accountId);

  const deltaMap = new Map(rows.map((r) => [r.accountId, r.delta ?? 0]));

  return accts.map((a) => {
    const balance =
      a.openingBalancePaise + (deltaMap.get(a.id) ?? 0);
    return { ...a, balancePaise: balance };
  });
}

export async function getNetWorthPaise(userId: string) {
  const balances = await getAccountBalances(userId);
  return balances.reduce((sum, a) => {
    if (a.type === "credit") return sum - a.balancePaise;
    return sum + a.balancePaise;
  }, 0);
}

export async function getMonthFlow(userId: string, month = currentMonth()) {
  const { start, end } = monthRange(month);
  const db = await getDb();
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, start),
        lte(transactions.date, end),
        isNull(transactions.transferGroupId),
      ),
    );

  let income = 0;
  let expense = 0;
  for (const tx of rows) {
    if (tx.direction === "IN") income += tx.amountPaise;
    else expense += tx.amountPaise;
  }
  return { incomePaise: income, expensePaise: expense, netPaise: income - expense };
}

export async function getTodayFlow(userId: string, date: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.date, date),
        isNull(transactions.transferGroupId),
      ),
    );
  let income = 0;
  let expense = 0;
  for (const tx of rows) {
    if (tx.direction === "IN") income += tx.amountPaise;
    else expense += tx.amountPaise;
  }
  return { incomePaise: income, expensePaise: expense };
}

export async function getSafeToSpend(userId: string, month = currentMonth()) {
  const db = await getDb();
  const budgetRows = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, userId), eq(budgets.month, month)));

  const totalBudget = budgetRows.reduce((s, b) => s + b.limitPaise, 0);
  if (totalBudget <= 0) return null;

  const { start, end } = monthRange(month);
  const spentRows = await db
    .select({ amount: transactions.amountPaise })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.direction, "OUT"),
        eq(categories.kind, "expense"),
        gte(transactions.date, start),
        lte(transactions.date, end),
        isNull(transactions.transferGroupId),
      ),
    );

  const spent = spentRows.reduce((s, r) => s + r.amount, 0);
  const remaining = totalBudget - spent;
  const daysLeft = daysRemainingInMonth();
  return {
    totalBudgetPaise: totalBudget,
    spentPaise: spent,
    remainingPaise: remaining,
    dailySafePaise: Math.max(0, Math.floor(remaining / daysLeft)),
    daysLeft,
  };
}

export async function getCategorySpend(
  userId: string,
  month = currentMonth(),
) {
  const { start, end } = monthRange(month);
  const db = await getDb();
  return db
    .select({
      categoryId: categories.id,
      name: categories.name,
      icon: categories.icon,
      spentPaise: sql<number>`COALESCE(SUM(${transactions.amountPaise}), 0)`,
    })
    .from(categories)
    .leftJoin(
      transactions,
      and(
        eq(transactions.categoryId, categories.id),
        eq(transactions.direction, "OUT"),
        gte(transactions.date, start),
        lte(transactions.date, end),
        isNull(transactions.transferGroupId),
      ),
    )
    .where(and(eq(categories.userId, userId), eq(categories.kind, "expense")))
    .groupBy(categories.id)
    .orderBy(sql`COALESCE(SUM(${transactions.amountPaise}), 0) DESC`);
}

export async function getBudgetProgress(userId: string, month = currentMonth()) {
  const db = await getDb();
  const budgetRows = await db
    .select({
      budgetId: budgets.id,
      limitPaise: budgets.limitPaise,
      categoryId: categories.id,
      name: categories.name,
      icon: categories.icon,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(eq(budgets.userId, userId), eq(budgets.month, month)));

  const { start, end } = monthRange(month);
  const spent = await getCategorySpend(userId, month);
  const spentMap = new Map(spent.map((s) => [s.categoryId, s.spentPaise]));

  return budgetRows.map((b) => ({
    ...b,
    spentPaise: spentMap.get(b.categoryId) ?? 0,
  }));
}

export async function getRecentTransactions(userId: string, limit = 10) {
  const db = await getDb();
  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      amountPaise: transactions.amountPaise,
      direction: transactions.direction,
      merchant: transactions.merchant,
      note: transactions.note,
      transferGroupId: transactions.transferGroupId,
      accountName: accounts.name,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(sql`${transactions.date} DESC, ${transactions.createdAt} DESC`)
    .limit(limit);
}

export async function getDailyReport(userId: string, date: string) {
  const db = await getDb();
  const rows = await db
    .select({
      id: transactions.id,
      amountPaise: transactions.amountPaise,
      direction: transactions.direction,
      merchant: transactions.merchant,
      note: transactions.note,
      transferGroupId: transactions.transferGroupId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      accountName: accounts.name,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.userId, userId), eq(transactions.date, date)))
    .orderBy(sql`${transactions.createdAt} DESC`);

  const flow = await getTodayFlow(userId, date);
  return { rows, ...flow };
}

export async function getMonthlyAnalysis(userId: string, month = currentMonth()) {
  const flow = await getMonthFlow(userId, month);
  const categoriesSpend = await getCategorySpend(userId, month);
  const top = categoriesSpend.filter((c) => c.spentPaise > 0).slice(0, 5);
  const savingsRate =
    flow.incomePaise > 0
      ? Math.round((flow.netPaise / flow.incomePaise) * 100)
      : null;

  const db = await getDb();
  const { start, end } = monthRange(month);
  const merchants = await db
    .select({
      merchant: transactions.merchant,
      total: sql<number>`SUM(${transactions.amountPaise})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.direction, "OUT"),
        gte(transactions.date, start),
        lte(transactions.date, end),
        isNull(transactions.transferGroupId),
      ),
    )
    .groupBy(transactions.merchant)
    .orderBy(sql`total DESC`)
    .limit(8);

  const tips: string[] = [];
  if (flow.expensePaise > flow.incomePaise && flow.incomePaise > 0) {
    tips.push("You are spending more than you earn — trim Misc/Buffer or eating out.");
  }
  const topCat = top[0];
  if (topCat && flow.expensePaise > 0) {
    const pct = Math.round((topCat.spentPaise / flow.expensePaise) * 100);
    if (pct >= 35) {
      tips.push(`${topCat.name} is ${pct}% of your spending — set a budget to track it.`);
    }
  }
  if (savingsRate != null && savingsRate >= 20) {
    tips.push(`Savings rate ${savingsRate}% — solid month!`);
  } else if (savingsRate != null && savingsRate < 10 && flow.incomePaise > 0) {
    tips.push("Low savings rate — review your subscriptions and auto-debits.");
  }

  return {
    flow,
    topCategories: top,
    topMerchants: merchants.filter((m) => m.merchant),
    savingsRate,
    tips,
  };
}
