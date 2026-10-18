"use client";

import { formatSignedPaise } from "@/lib/money";
import { deleteTransaction } from "@/actions/transactions";
import { useTransition } from "react";

type Row = {
  id: string;
  date: string;
  amountPaise: number;
  direction: "IN" | "OUT";
  merchant: string | null;
  note: string | null;
  transferGroupId: string | null;
  accountName?: string;
  categoryName?: string | null;
  categoryIcon?: string | null;
};

export function TransactionRow({ tx }: { tx: Row }) {
  const [pending, startTransition] = useTransition();
  const isTransfer = !!tx.transferGroupId;
  const title =
    tx.merchant ||
    tx.note ||
    (isTransfer ? "Transfer" : tx.categoryName) ||
    "Entry";

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-[var(--bg-muted)]/80 px-3 py-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
          isTransfer
            ? "bg-[var(--accent-soft)]"
            : tx.direction === "IN"
              ? "bg-[var(--income-soft)]"
              : "bg-[var(--expense-soft)]"
        }`}
      >
        {isTransfer ? "↔" : (tx.categoryIcon ?? (tx.direction === "IN" ? "↓" : "↑"))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[var(--text-primary)]">{title}</p>
        <p className="truncate text-xs text-[var(--text-muted)]">
          {tx.accountName}
          {tx.categoryName && !isTransfer ? ` · ${tx.categoryName}` : ""}
          {" · "}
          {tx.date}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className={`font-display text-sm font-bold ${
            isTransfer
              ? "text-[var(--accent)]"
              : tx.direction === "IN"
                ? "text-[var(--income)]"
                : "text-[var(--expense)]"
          }`}
        >
          {isTransfer
            ? formatSignedPaise(tx.amountPaise, tx.direction)
            : formatSignedPaise(tx.amountPaise, tx.direction)}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteTransaction(tx.id);
            })
          }
          className="text-[10px] text-[var(--text-muted)] underline-offset-2 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
