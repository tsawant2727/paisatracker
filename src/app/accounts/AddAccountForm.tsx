"use client";

import { useState, useTransition } from "react";
import { createAccount } from "@/actions/accounts";
import { parseAmountInput } from "@/lib/money";

export function AddAccountForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"bank" | "cash" | "credit" | "wallet">(
    "bank",
  );
  const [opening, setOpening] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 p-4">
      <h2 className="font-display text-lg font-semibold">New account</h2>
      <div className="mt-3 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. ICICI, Paytm"
          className="input-text"
        />
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as "bank" | "cash" | "credit" | "wallet")
          }
          className="input-select"
        >
          <option value="bank">Bank</option>
          <option value="wallet">Wallet / UPI</option>
          <option value="cash">Cash</option>
          <option value="credit">Credit card</option>
        </select>
        <input
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
          placeholder="Opening balance ₹ (optional)"
          inputMode="decimal"
          className="input-text"
        />
        <button
          type="button"
          disabled={pending || !name.trim()}
          className="w-full rounded-2xl border border-[var(--accent)] py-3 font-semibold text-[var(--accent)] disabled:opacity-50"
          onClick={() =>
            startTransition(async () => {
              await createAccount({
                name,
                type,
                openingBalancePaise: parseAmountInput(opening) ?? 0,
              });
              setName("");
              setOpening("");
            })
          }
        >
          Add account
        </button>
      </div>
    </section>
  );
}
