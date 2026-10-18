import { and, eq, gte, lte, like, or, sql, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts, categories, transactions } from "@/db/schema";
import { TransactionRow } from "@/components/TransactionRow";
import { getCurrentUserId } from "@/lib/user";
import { currentMonth, monthRange } from "@/lib/dates";
import { TransactionFilters } from "./TransactionFilters";

type Props = {
  searchParams: Promise<{ q?: string; month?: string; dir?: string }>;
};

export default async function TransactionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const userId = await getCurrentUserId();
  const month = sp.month ?? currentMonth();
  const { start, end } = monthRange(month);
  const db = await getDb();

  const conditions = [
    eq(transactions.userId, userId),
    gte(transactions.date, start),
    lte(transactions.date, end),
  ];

  if (sp.dir === "in") {
    conditions.push(eq(transactions.direction, "IN"));
    conditions.push(isNull(transactions.transferGroupId));
  } else if (sp.dir === "out") {
    conditions.push(eq(transactions.direction, "OUT"));
    conditions.push(isNull(transactions.transferGroupId));
  } else if (sp.dir === "transfer") {
    conditions.push(sql`${transactions.transferGroupId} IS NOT NULL`);
  }

  if (sp.q?.trim()) {
    const q = `%${sp.q.trim()}%`;
    conditions.push(
      or(
        like(transactions.merchant, q),
        like(transactions.note, q),
        like(categories.name, q),
      )!,
    );
  }

  const rows = await db
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
    .where(and(...conditions))
    .orderBy(sql`${transactions.date} DESC, ${transactions.createdAt} DESC`)
    .limit(200);

  const seenTransfer = new Set<string>();
  const display = rows.filter((tx) => {
    if (!tx.transferGroupId) return true;
    if (seenTransfer.has(tx.transferGroupId)) return false;
    seenTransfer.add(tx.transferGroupId);
    return tx.direction === "OUT";
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Ledger
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Filter, search, delete — full history
        </p>
      </header>

      <TransactionFilters month={month} q={sp.q} dir={sp.dir} />

      <ul className="space-y-2">
        {display.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-muted)]">
            Nothing matches this filter
          </li>
        ) : (
          display.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </ul>
    </div>
  );
}
