import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Paisa Tracker
          </p>
          <h1 className="font-display mt-2 text-2xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Sign in to view your money.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
