import { formatPaise } from "@/lib/money";

export function MoneyHero({
  label,
  paise,
  sub,
}: {
  label: string;
  paise: number;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-muted)] p-5">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--accent)] opacity-[0.07] blur-2xl"
        aria-hidden
      />
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="font-display mt-2 text-[2.35rem] font-bold leading-none tracking-tight text-[var(--text-primary)]">
        {formatPaise(paise, true)}
      </p>
      {sub && (
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{sub}</p>
      )}
    </div>
  );
}
