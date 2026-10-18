"use server";

import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts, categories } from "@/db/schema";
import { getCurrentUserId } from "@/lib/user";

export async function getAccountsForForm() {
  const userId = await getCurrentUserId();
  const db = await getDb();
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(asc(accounts.sortOrder));
}

export async function getCategoriesForForm(kind?: "expense" | "income") {
  const userId = await getCurrentUserId();
  const db = await getDb();
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.sortOrder));
  if (!kind) return rows;
  return rows.filter((c) => c.kind === kind);
}
