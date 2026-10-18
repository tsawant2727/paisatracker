import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { budgets, categories } from "@/db/schema";
import { BudgetEditor } from "./BudgetEditor";
import { getCategorySpend } from "@/lib/analytics";
import { getCurrentUserId } from "@/lib/user";
import { currentMonth, monthLabel } from "@/lib/dates";
import { formatPaise } from "@/lib/money";

export default async function BudgetsPage() {
  const userId = await getCurrentUserId();
  const month = currentMonth();
  const db = await getDb();

  const expenseCats = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.sortOrder));

  const expenseOnly = expenseCats.filter((c) => c.kind === "expense");

  const budgetRows = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId));

  const budgetMap = new Map(
    budgetRows
      .filter((b) => b.month === month)
      .map((b) => [b.categoryId, b.limitPaise]),
  );

  const spent = await getCategorySpend(userId, month);
  const spentMap = new Map(spent.map((s) => [s.categoryId, s.spentPaise]));

  const totalLimit = expenseOnly.reduce(
    (s, c) => s + (budgetMap.get(c.id) ?? 0),
    0,
  );
  const totalSpent = expenseOnly.reduce(
    (s, c) => s + (spentMap.get(c.id) ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Budget
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {monthLabel(month)} — category limits
        </p>
        <p className="mt-2 text-sm">
          <span className="text-[var(--text-muted)]">Total: </span>
          <span className="font-semibold text-[var(--expense)]">
            {formatPaise(totalSpent)}
          </span>
          <span className="text-[var(--text-muted)]"> / </span>
          <span className="font-semibold">{formatPaise(totalLimit)}</span>
        </p>
      </header>

      <ul className="space-y-4">
        {expenseOnly.map((cat) => (
          <li
            key={cat.id}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/40 p-4"
          >
            <BudgetEditor
              categoryId={cat.id}
              name={cat.name}
              icon={cat.icon}
              limitPaise={budgetMap.get(cat.id) ?? 0}
              spentPaise={spentMap.get(cat.id) ?? 0}
              month={month}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
