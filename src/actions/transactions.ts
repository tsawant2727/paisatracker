"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { getDb } from "@/db";
import { transactions } from "@/db/schema";
import { getCurrentUserId } from "@/lib/user";
import { todayISO } from "@/lib/dates";

export type EntryKind = "IN" | "OUT" | "TRANSFER";

export async function createTransaction(input: {
  kind: EntryKind;
  amountPaise: number;
  accountId: string;
  categoryId?: string;
  toAccountId?: string;
  date?: string;
  merchant?: string;
  note?: string;
}) {
  const userId = await getCurrentUserId();
  const db = await getDb();
  const date = input.date ?? todayISO();
  const now = new Date();

  if (input.kind === "TRANSFER") {
    if (!input.toAccountId || input.toAccountId === input.accountId) {
      throw new Error("A transfer needs a different account");
    }
    const groupId = uuid();
    await db.insert(transactions).values([
      {
        id: uuid(),
        userId,
        accountId: input.accountId,
        date,
        amountPaise: input.amountPaise,
        direction: "OUT",
        categoryId: null,
        merchant: input.merchant ?? "Transfer",
        note: input.note,
        transferGroupId: groupId,
        counterpartyAccountId: input.toAccountId,
        source: "manual",
        createdAt: now,
      },
      {
        id: uuid(),
        userId,
        accountId: input.toAccountId,
        date,
        amountPaise: input.amountPaise,
        direction: "IN",
        categoryId: null,
        merchant: input.merchant ?? "Transfer",
        note: input.note,
        transferGroupId: groupId,
        counterpartyAccountId: input.accountId,
        source: "manual",
        createdAt: now,
      },
    ]);
  } else {
    if (!input.categoryId) throw new Error("Category required");
    await db.insert(transactions).values({
      id: uuid(),
      userId,
      accountId: input.accountId,
      date,
      amountPaise: input.amountPaise,
      direction: input.kind,
      categoryId: input.categoryId,
      merchant: input.merchant,
      note: input.note,
      transferGroupId: null,
      counterpartyAccountId: null,
      source: "manual",
      createdAt: now,
    });
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/reports");
  revalidatePath("/budgets");
}

export async function deleteTransaction(id: string) {
  const userId = await getCurrentUserId();
  const db = await getDb();
  const [tx] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);
  if (!tx) return;

  if (tx.transferGroupId) {
    await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.transferGroupId, tx.transferGroupId),
        ),
      );
  } else {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/reports");
}
