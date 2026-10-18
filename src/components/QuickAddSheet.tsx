"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createTransaction,
  type EntryKind,
} from "@/actions/transactions";
import {
  getAccountsForForm,
  getCategoriesForForm,
} from "@/actions/data";
import type { Account, Category } from "@/db/schema";
import { parseAmountInput } from "@/lib/money";
import { todayISO } from "@/lib/dates";

const LAST_ACCOUNT_KEY = "paisa-last-account";

type Props = { open: boolean; onClose: () => void };

export function QuickAddSheet({ open, onClose }: Props) {
  const [kind, setKind] = useState<EntryKind>("OUT");
  const [amount, setAmount] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDate(todayISO());
    setError(null);
    void (async () => {
      const [accts, cats] = await Promise.all([
        getAccountsForForm(),
        getCategoriesForForm(),
      ]);
      setAccounts(accts);
      setCategories(cats);
      const last =
        typeof window !== "undefined"
          ? localStorage.getItem(LAST_ACCOUNT_KEY)
          : null;
      const defaultAcct =
        accts.find((a) => a.id === last)?.id ?? accts[0]?.id ?? "";
      setAccountId(defaultAcct);
      setToAccountId(accts.find((a) => a.id !== defaultAcct)?.id ?? "");
      const expenseCats = cats.filter((c) => c.kind === "expense");
      setCategoryId(expenseCats[0]?.id ?? "");
    })();
  }, [open]);

  useEffect(() => {
    if (kind === "IN") {
      const inc = categories.filter((c) => c.kind === "income");
      if (inc.length && !inc.find((c) => c.id === categoryId)) {
        setCategoryId(inc[0].id);
      }
    } else if (kind === "OUT") {
      const exp = categories.filter((c) => c.kind === "expense");
      if (exp.length && !exp.find((c) => c.id === categoryId)) {
        setCategoryId(exp[0].id);
      }
    }
  }, [kind, categories, categoryId]);

  if (!open) return null;

  const filteredCats =
    kind === "IN"
      ? categories.filter((c) => c.kind === "income")
      : categories.filter((c) => c.kind === "expense");

  function submit() {
    const paise = parseAmountInput(amount);
    if (!paise) {
      setError("Enter a valid amount");
      return;
    }
    if (!accountId) {
      setError("Select an account");
      return;
    }
    startTransition(async () => {
      try {
        await createTransaction({
          kind,
          amountPaise: paise,
          accountId,
          categoryId: kind === "TRANSFER" ? undefined : categoryId,
          toAccountId: kind === "TRANSFER" ? toAccountId : undefined,
          date,
          merchant: merchant.trim() || undefined,
          note: note.trim() || undefined,
        });
        localStorage.setItem(LAST_ACCOUNT_KEY, accountId);
        setAmount("");
        setMerchant("");
        setNote("");
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save fail");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Quick entry
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          3 tap: type → amount → save
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(
            [
              ["OUT", "Expense", "expense"],
              ["IN", "Income", "income"],
              ["TRANSFER", "Transfer", "neutral"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-2xl py-3 text-sm font-semibold transition-all ${
                kind === k
                  ? k === "OUT"
                    ? "bg-[var(--expense-soft)] text-[var(--expense)]"
                    : k === "IN"
                      ? "bg-[var(--income-soft)] text-[var(--income)]"
                      : "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Amount (₹)
          </span>
          <input
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full border-0 bg-transparent font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            autoFocus
          />
        </label>

        <div className="mt-4 space-y-3">
          {kind !== "TRANSFER" && (
            <Field label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-select"
              >
                {filteredCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Account">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input-select"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>

          {kind === "TRANSFER" && (
            <Field label="To account">
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="input-select"
              >
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </Field>
          )}

          <Field label="Who / where (optional)">
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={kind === "IN" ? "Salary, friend…" : "Swiggy, rent…"}
              className="input-text"
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-text"
            />
          </Field>

          <Field label="Note">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="input-text"
            />
          </Field>
        </div>

        {error && (
          <p className="mt-3 text-sm text-[var(--expense)]">{error}</p>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="mt-5 w-full rounded-2xl bg-[var(--accent)] py-4 text-center font-semibold text-[var(--bg-base)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save entry"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--text-muted)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
