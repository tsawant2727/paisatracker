import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["bank", "cash", "credit", "wallet"] }).notNull(),
  openingBalancePaise: integer("opening_balance_paise").notNull().default(0),
  color: text("color").notNull().default("#3dffa8"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["expense", "income"] }).notNull(),
  icon: text("icon").notNull().default("•"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  date: text("date").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  direction: text("direction", { enum: ["IN", "OUT"] }).notNull(),
  categoryId: text("category_id").references(() => categories.id),
  merchant: text("merchant"),
  note: text("note"),
  transferGroupId: text("transfer_group_id"),
  counterpartyAccountId: text("counterparty_account_id").references(
    () => accounts.id,
  ),
  source: text("source", { enum: ["manual", "csv", "sms", "adjustment"] })
    .notNull()
    .default("manual"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const budgets = sqliteTable("budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  month: text("month").notNull(),
  limitPaise: integer("limit_paise").notNull(),
});

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
