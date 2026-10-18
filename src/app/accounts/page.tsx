import { AccountCard } from "@/components/AccountCard";
import { AddAccountForm } from "./AddAccountForm";
import { getAccountBalances } from "@/lib/analytics";
import { getCurrentUserId } from "@/lib/user";
import { formatPaise } from "@/lib/money";

export default async function AccountsPage() {
  const userId = await getCurrentUserId();
  const accounts = await getAccountBalances(userId);
  const net = accounts.reduce((s, a) => {
    if (a.type === "credit") return s - a.balancePaise;
    return s + a.balancePaise;
  }, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Accounts
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          All your banks, cash and cards in one place
        </p>
        <p className="font-display mt-3 text-xl font-bold text-[var(--accent)]">
          Net {formatPaise(net)}
        </p>
      </header>

      <div className="grid gap-3">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} balancePaise={a.balancePaise} />
        ))}
      </div>

      <AddAccountForm />
    </div>
  );
}
