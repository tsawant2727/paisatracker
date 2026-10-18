"use client";

import { useState, useTransition } from "react";
import { deleteAccount, updateAccount } from "@/actions/accounts";
import { formatPaise } from "@/lib/money";
import type { Account } from "@/db/schema";

type AccountType = "bank" | "cash" | "credit" | "wallet";

/** Parse a rupee string to paise. Allows 0 and negatives (unlike the add form). */
function parseRupees(raw: string): number {
  const cleaned = raw.replace(/[₹,\s]/g, "").trim();
  if (!cleaned || cleaned === "-") return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function EditableAccountCard({
  account,
  balancePaise,
}: {
  account: Account;
  balancePaise: number;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<AccountType>(account.type);
  const [opening, setOpening] = useState(
    account.openingBalancePaise ? String(account.openingBalancePaise / 100) : "",
  );
  const [pending, startTransition] = useTransition();

  const isCredit = account.type === "credit";

  if (!editing) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] p-4"
        style={{
          background: `linear-gradient(135deg, ${account.color}18 0%, var(--bg-muted) 55%)`,
        }}
      >
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute right-2 top-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] backdrop-blur"
        >
          Edit
        </button>
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

  return (
    <div className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--bg-muted)]/60 p-4">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-text"
            placeholder="Account name"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            className="input-select"
          >
            <option value="bank">Bank</option>
            <option value="wallet">Wallet / UPI</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit card</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Opening balance (₹)
          </label>
          <input
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            inputMode="decimal"
            className="input-text"
            placeholder="0"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Current balance: {formatPaise(balancePaise)} (opening + entries)
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={pending || !name.trim()}
            onClick={() =>
              startTransition(async () => {
                await updateAccount(account.id, {
                  name,
                  type,
                  openingBalancePaise: parseRupees(opening),
                });
                setEditing(false);
              })
            }
            className="flex-1 rounded-2xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[#06281a] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setEditing(false);
              setConfirmDelete(false);
              setName(account.name);
              setType(account.type);
              setOpening(
                account.openingBalancePaise
                  ? String(account.openingBalancePaise / 100)
                  : "",
              );
            }}
            className="rounded-2xl border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)]"
          >
            Cancel
          </button>
        </div>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full rounded-2xl border border-[var(--expense)]/40 py-2.5 text-sm font-medium text-[var(--expense)]"
          >
            Delete account
          </button>
        ) : (
          <div className="rounded-2xl border border-[var(--expense)]/40 bg-[var(--expense-soft)] p-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Delete <b>{account.name}</b> and all its entries? This can&apos;t be
              undone.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteAccount(account.id);
                  })
                }
                className="flex-1 rounded-xl bg-[var(--expense)] py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)]"
              >
                Keep
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
