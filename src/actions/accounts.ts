"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { getDb } from "@/db";
import { accounts } from "@/db/schema";
import { getCurrentUserId } from "@/lib/user";

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
  revalidatePath("/");
  revalidatePath("/accounts");
}
