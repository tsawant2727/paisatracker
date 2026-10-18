import Link from "next/link";
import { MoneyHero } from "@/components/MoneyHero";
import { StatPills } from "@/components/StatPills";
import { TransactionRow } from "@/components/TransactionRow";
import { BudgetBar } from "@/components/BudgetBar";
import { AccountCard } from "@/components/AccountCard";
import {
  getAccountBalances,
  getBudgetProgress,
  getMonthFlow,
  getNetWorthPaise,
  getRecentTransactions,
  getSafeToSpend,
  getTodayFlow,
} from "@/lib/analytics";
import { getCurrentUserId } from "@/lib/user";
import { formatPaise } from "@/lib/money";
import { currentMonth, monthLabel, todayISO } from "@/lib/dates";

export default async function HomePage() {
  const userId = await getCurrentUserId();
  const month = currentMonth();
  const today = todayISO();

  const [
    netWorth,
    monthFlow,
    todayFlow,
    safe,
    accounts,
    recent,
    budgetProgress,
  ] = await Promise.all([
    getNetWorthPaise(userId),
    getMonthFlow(userId, month),
    getTodayFlow(userId, today),
    getSafeToSpend(userId, month),
    getAccountBalances(userId),
    getRecentTransactions(userId, 8),
    getBudgetProgress(userId, month),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
          Paisa Tracker
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight">
          {monthLabel(month)}
        </h1>
      </header>

      <MoneyHero
        label="Total net worth"
        paise={netWorth}
        sub={
          safe
            ? `Safe to spend today ~ ${formatPaise(safe.dailySafePaise)} · ${safe.daysLeft} days left`
            : "Set a budget to see your daily safe-to-spend"
        }
      />

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Today ({today})
        </p>
        <StatPills
          income={todayFlow.incomePaise}
          expense={todayFlow.expensePaise}
          net={todayFlow.incomePaise - todayFlow.expensePaise}
        />
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          This month
        </p>
        <StatPills
          income={monthFlow.incomePaise}
          expense={monthFlow.expensePaise}
          net={monthFlow.netPaise}
        />
      </section>

      {budgetProgress.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Budget</h2>
            <Link
              href="/budgets"
              className="text-sm text-[var(--accent)]"
            >
              Edit
            </Link>
          </div>
          {budgetProgress.slice(0, 4).map((b) => (
            <BudgetBar
              key={b.budgetId}
              name={b.name}
              icon={b.icon}
              spent={b.spentPaise}
              limit={b.limitPaise}
            />
          ))}
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Accounts</h2>
          <Link href="/accounts" className="text-sm text-[var(--accent)]">
            Manage
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {accounts.map((a) => (
            <div key={a.id} className="w-[min(72vw,260px)] shrink-0">
              <AccountCard account={a} balancePaise={a.balancePaise} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent</h2>
          <Link href="/transactions" className="text-sm text-[var(--accent)]">
            All
          </Link>
        </div>
        <ul className="space-y-2">
          {recent.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-[var(--text-muted)]">
              Tap + to add your first entry in seconds
            </li>
          ) : (
            recent.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </ul>
      </section>
    </div>
  );
}
