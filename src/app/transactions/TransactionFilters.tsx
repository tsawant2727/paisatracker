"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { currentMonth } from "@/lib/dates";

export function TransactionFilters({
  month,
  q,
  dir,
}: {
  month: string;
  q?: string;
  dir?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/transactions?${next.toString()}`);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 p-3">
      <input
        defaultValue={q ?? ""}
        placeholder="Search merchant, note…"
        className="input-text"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            update("q", (e.target as HTMLInputElement).value);
          }
        }}
      />
      <div className="flex gap-2 overflow-x-auto">
        <input
          type="month"
          defaultValue={month}
          className="input-text shrink-0"
          onChange={(e) => update("month", e.target.value)}
        />
        {[
          ["", "All"],
          ["out", "Expense"],
          ["in", "Income"],
          ["transfer", "Transfer"],
        ].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => update("dir", val)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
              (dir ?? "") === val
                ? "bg-[var(--accent)] text-[var(--bg-base)]"
                : "bg-[var(--bg-base)] text-[var(--text-secondary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-[var(--text-muted)]">
        Default month: {currentMonth()}
      </p>
    </div>
  );
}
