import { logout } from "@/actions/auth";
import { getSessionUser } from "@/lib/session";
import { BottomNav } from "./BottomNav";
import { QuickAddFab } from "./QuickAddFab";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  // Signed-out routes (e.g. /login) render without the nav chrome.
  if (!user) {
    return (
      <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        {children}
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <header className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
        <span className="text-sm text-[var(--text-muted)]">
          Hi, <span className="text-[var(--text-secondary)]">{user.name}</span>
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition active:scale-95"
          >
            Log out
          </button>
        </form>
      </header>
      <main className="flex-1 px-4 pb-28 pt-2">{children}</main>
      <QuickAddFab />
      <BottomNav />
    </div>
  );
}
