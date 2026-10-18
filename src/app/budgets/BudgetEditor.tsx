"use client";

import { useState, useTransition } from "react";
import { upsertBudget } from "@/actions/budgets";
import { formatPaise } from "@/lib/money";
import { BudgetBar } from "@/components/BudgetBar";

export function BudgetEditor({
  categoryId,
  name,
  icon,
  limitPaise,
  spentPaise,
  month,
}: {
  categoryId: string;
  name: string;
  icon: string;
  limitPaise: number;
  spentPaise: number;
  month: string;
}) {
  const [limit, setLimit] = useState(
    limitPaise > 0 ? String(limitPaise / 100) : "",
  );
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {icon} {name}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Spent {formatPaise(spentPaise)}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="₹ limit"
            className="input-text w-24 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending}
            className="shrink-0 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--bg-base)]"
            onClick={() =>
              startTransition(async () => {
                const n = Number(limit.replace(/,/g, ""));
                if (!Number.isFinite(n) || n < 0) return;
                await upsertBudget(categoryId, Math.round(n * 100), month);
              })
            }
          >
            Save
          </button>
        </div>
      </div>
      {limitPaise > 0 && (
        <BudgetBar
          name={name}
          icon={icon}
          spent={spentPaise}
          limit={limitPaise}
        />
      )}
    </div>
  );
}
