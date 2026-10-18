"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { getDb } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { getCurrentUserId } from "@/lib/user";

function revalidateMoney() {
  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/reports");
}

export async function createAccount(input: {
  name: string;
  type: "bank" | "cash" | "credit" | "wallet";
  openingBalancePaise: number;
  color?: string;
}) {
  const userId = await getCurrentUserId();
  const db = await getDb();
  const existing = await db
    .select({ c: accounts.sortOrder })
    .from(accounts)
    .where(eq(accounts.userId, userId));
  const sortOrder = existing.length;

  await db.insert(accounts).values({
    id: uuid(),
    userId,
    name: input.name.trim(),
    type: input.type,
    openingBalancePaise: input.openingBalancePaise,
    color: input.color ?? "#3dffa8",
    sortOrder,
    createdAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath("/accounts");
}

export async function updateAccountOpening(
  id: string,
  openingBalancePaise: number,
) {
  const userId = await getCurrentUserId();
  const db = await getDb();
  await db
    .update(accounts)
    .set({ openingBalancePaise })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  revalidateMoney();
}

/** Rename an account, change its type/colour, and/or set its opening balance. */
export async function updateAccount(
  id: string,
  input: {
    name: string;
    type: "bank" | "cash" | "credit" | "wallet";
    openingBalancePaise: number;
    color?: string;
  },
) {
  const userId = await getCurrentUserId();
  const name = input.name.trim();
  if (!name) throw new Error("Account name is required");

  const db = await getDb();
  await db
    .update(accounts)
    .set({
      name,
      type: input.type,
      openingBalancePaise: input.openingBalancePaise,
      ...(input.color ? { color: input.color } : {}),
    })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  revalidateMoney();
}

/**
 * Delete an account and every transaction tied to it (including the matching
 * side of any transfer). Irreversible.
 */
export async function deleteAccount(id: string) {
  const userId = await getCurrentUserId();
  const db = await getDb();

  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        or(
          eq(transactions.accountId, id),
          eq(transactions.counterpartyAccountId, id),
        ),
      ),
    );

  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  revalidateMoney();
}
