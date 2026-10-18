import { formatPaise } from "@/lib/money";

export function StatPills({
  income,
  expense,
  net,
}: {
  income: number;
  expense: number;
  net: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Pill label="In" value={income} tone="income" />
      <Pill label="Out" value={expense} tone="expense" />
      <Pill label="Net" value={net} tone={net >= 0 ? "income" : "expense"} />
    </div>
  );
}

function Pill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "income" | "expense";
}) {
  return (
    <div className="rounded-2xl bg-[var(--bg-muted)] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-sm font-bold ${
          tone === "income" ? "text-[var(--income)]" : "text-[var(--expense)]"
        }`}
      >
        {formatPaise(Math.abs(value))}
      </p>
    </div>
  );
}
