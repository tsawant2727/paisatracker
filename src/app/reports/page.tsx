import Link from "next/link";
import { getMonthlyAnalysis, getDailyReport } from "@/lib/analytics";
import { getCurrentUserId } from "@/lib/user";
import { currentMonth, monthLabel, todayISO } from "@/lib/dates";
import { formatPaise } from "@/lib/money";
import { StatPills } from "@/components/StatPills";
import { ReportMonthPicker } from "./ReportMonthPicker";

type Props = { searchParams: Promise<{ month?: string; day?: string }> };

export default async function ReportsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const userId = await getCurrentUserId();
  const month = sp.month ?? currentMonth();
  const day = sp.day ?? todayISO();

  const [analysis, daily] = await Promise.all([
    getMonthlyAnalysis(userId, month),
    getDailyReport(userId, day),
  ]);

  const maxCat = analysis.topCategories[0]?.spentPaise ?? 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Insights
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Daily and monthly — see where your money goes
        </p>
      </header>

      <ReportMonthPicker month={month} day={day} />

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/40 p-4">
        <h2 className="font-display text-lg font-semibold">
          Daily — {day}
        </h2>
        <div className="mt-3">
          <StatPills
            income={daily.incomePaise}
            expense={daily.expensePaise}
            net={daily.incomePaise - daily.expensePaise}
          />
        </div>
        <ul className="mt-4 space-y-2">
          {daily.rows.length === 0 ? (
            <li className="text-sm text-[var(--text-muted)]">No entries today</li>
          ) : (
            daily.rows.map((r) => (
              <li
                key={r.id}
                className="flex justify-between gap-2 text-sm border-b border-[var(--border-subtle)] pb-2 last:border-0"
              >
                <span className="truncate">
                  {r.categoryIcon}{" "}
                  {r.merchant || r.categoryName || r.note || "—"}
                </span>
                <span
                  className={
                    r.direction === "IN"
                      ? "text-[var(--income)]"
                      : "text-[var(--expense)]"
                  }
                >
                  {r.direction === "IN" ? "+" : "−"}
                  {formatPaise(r.amountPaise)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">
          {monthLabel(month)}
        </h2>
        <div className="mt-3">
          <StatPills
            income={analysis.flow.incomePaise}
            expense={analysis.flow.expensePaise}
            net={analysis.flow.netPaise}
          />
        </div>
        {analysis.savingsRate != null && (
          <p className="mt-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm">
            Savings rate:{" "}
            <strong className="text-[var(--accent)]">
              {analysis.savingsRate}%
            </strong>
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Top categories
        </h3>
        <ul className="mt-3 space-y-3">
          {analysis.topCategories.map((c) => (
            <li key={c.categoryId}>
              <div className="mb-1 flex justify-between text-sm">
                <span>
                  {c.icon} {c.name.split("/")[0].trim()}
                </span>
                <span>{formatPaise(c.spentPaise)}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--expense)]"
                  style={{
                    width: `${Math.round((c.spentPaise / maxCat) * 100)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {analysis.topMerchants.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Top merchants
          </h3>
          <ul className="mt-2 divide-y divide-[var(--border-subtle)] rounded-2xl border border-[var(--border-subtle)]">
            {analysis.topMerchants.map((m) => (
              <li
                key={String(m.merchant)}
                className="flex justify-between px-4 py-3 text-sm"
              >
                <span>{m.merchant}</span>
                <span className="text-[var(--text-muted)]">
                  {formatPaise(m.total)} · {m.count}x
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {analysis.tips.length > 0 && (
        <section className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4">
          <h3 className="font-display font-semibold text-[var(--accent)]">
            Optimize
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--text-secondary)]">
            {analysis.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-[var(--text-muted)]">
        <Link href="/" className="text-[var(--accent)]">
          Home
        </Link>{" "}
        · CSV export P1 (PRD.md)
      </p>
    </div>
  );
}
