"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { getDb } from "@/db";
import { budgets } from "@/db/schema";
import { getCurrentUserId } from "@/lib/user";
import { currentMonth } from "@/lib/dates";

export async function upsertBudget(categoryId: string, limitPaise: number, month?: string) {
  const userId = await getCurrentUserId();
  const m = month ?? currentMonth();
  const db = await getDb();

  const [existing] = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.categoryId, categoryId),
        eq(budgets.month, m),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(budgets)
      .set({ limitPaise })
      .where(eq(budgets.id, existing.id));
  } else {
    await db.insert(budgets).values({
      id: uuid(),
      userId,
      categoryId,
      month: m,
      limitPaise,
    });
  }

  revalidatePath("/");
  revalidatePath("/budgets");
}
