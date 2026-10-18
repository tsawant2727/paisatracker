import { formatPaise } from "@/lib/money";
import type { Account } from "@/db/schema";

export function AccountCard({
  account,
  balancePaise,
}: {
  account: Account;
  balancePaise: number;
}) {
  const isCredit = account.type === "credit";
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] p-4"
      style={{
        background: `linear-gradient(135deg, ${account.color}18 0%, var(--bg-muted) 55%)`,
      }}
    >
      <div
        className="absolute right-3 top-3 h-8 w-8 rounded-full opacity-40"
        style={{ background: account.color }}
        aria-hidden
      />
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {account.type}
      </p>
      <p className="mt-1 font-display text-lg font-semibold">{account.name}</p>
      <p
        className={`mt-3 font-display text-2xl font-bold ${
          isCredit && balancePaise > 0 ? "text-[var(--expense)]" : ""
        }`}
      >
        {isCredit && balancePaise > 0 ? "−" : ""}
        {formatPaise(balancePaise)}
      </p>
      {isCredit && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Card due (reduces net worth)
        </p>
      )}
    </div>
  );
}
