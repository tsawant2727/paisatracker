import { formatPaise } from "@/lib/money";

export function BudgetBar({
  name,
  icon,
  spent,
  limit,
}: {
  name: string;
  icon: string;
  spent: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const over = spent > limit;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="truncate font-medium">
          {icon} {name.split("/")[0].trim()}
        </span>
        <span className="shrink-0 text-xs text-[var(--text-muted)]">
          {formatPaise(spent)} / {formatPaise(limit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <div
          className={`h-full rounded-full transition-all ${
            over ? "bg-[var(--expense)]" : "bg-[var(--accent)]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
