import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { v4 as uuid } from "uuid";
import * as schema from "./schema";
import {
  DEFAULT_USER_ID,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "./seed-data";
import { hashPassword } from "@/lib/auth";

let _db: LibSQLDatabase<typeof schema> | null = null;
let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

function getClient(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL (or DATABASE_URL) is not set. See .env.example.",
    );
  }
  _client = createClient({ url, authToken });
  return _client;
}

async function ensureSchema(client: Client) {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      password_hash TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      opening_balance_paise INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT '#3dffa8',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '•',
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      date TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      direction TEXT NOT NULL,
      category_id TEXT REFERENCES categories(id),
      merchant TEXT,
      note TEXT,
      transfer_group_id TEXT,
      counterparty_account_id TEXT REFERENCES accounts(id),
      source TEXT NOT NULL DEFAULT 'manual',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      category_id TEXT NOT NULL REFERENCES categories(id),
      month TEXT NOT NULL,
      limit_paise INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_cat_month ON budgets(user_id, category_id, month);
  `);

  // Backfill auth columns for databases created before login was added.
  const info = await client.execute("PRAGMA table_info(users)");
  const names = new Set(info.rows.map((r) => r.name as string));
  if (!names.has("username")) {
    await client.execute("ALTER TABLE users ADD COLUMN username TEXT");
    await client.execute(
      "CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username)",
    );
  }
  if (!names.has("password_hash")) {
    await client.execute("ALTER TABLE users ADD COLUMN password_hash TEXT");
  }
}

/** Seed default categories + accounts for a user, only if they have none. */
async function provisionDefaults(client: Client, userId: string) {
  const existing = await client.execute({
    sql: "SELECT COUNT(*) as c FROM categories WHERE user_id = ?",
    args: [userId],
  });
  if (Number(existing.rows[0].c) > 0) return;

  const now = Date.now();
  const stmts: { sql: string; args: (string | number)[] }[] = [];

  EXPENSE_CATEGORIES.forEach((cat, i) => {
    stmts.push({
      sql: `INSERT INTO categories (id, user_id, name, kind, icon, sort_order)
            VALUES (?, ?, ?, 'expense', ?, ?)`,
      args: [uuid(), userId, cat.name, cat.icon, i],
    });
  });
  INCOME_CATEGORIES.forEach((cat, i) => {
    stmts.push({
      sql: `INSERT INTO categories (id, user_id, name, kind, icon, sort_order)
            VALUES (?, ?, ?, 'income', ?, ?)`,
      args: [uuid(), userId, cat.name, cat.icon, i],
    });
  });

  const accountDefaults = [
    { name: "HDFC Savings", type: "bank", color: "#4f8cff", opening: 0 },
    { name: "Cash", type: "cash", color: "#3dffa8", opening: 0 },
    { name: "Credit Card", type: "credit", color: "#ff6b6b", opening: 0 },
  ];
  accountDefaults.forEach((a, i) => {
    stmts.push({
      sql: `INSERT INTO accounts (id, user_id, name, type, opening_balance_paise, color, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [uuid(), userId, a.name, a.type, a.opening, a.color, i, now],
    });
  });

  await client.batch(stmts, "write");
}

async function seedIfEmpty(client: Client) {
  const row = await client.execute("SELECT COUNT(*) as c FROM users");
  if (Number(row.rows[0].c) > 0) return;

  await client.execute({
    sql: "INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)",
    args: [DEFAULT_USER_ID, "You", Date.now()],
  });
  await provisionDefaults(client, DEFAULT_USER_ID);
}

type SeedUser = { username: string; password: string; name?: string };

/**
 * Creates/updates login users from the PAISA_SEED_USERS env var (JSON array of
 * { username, password, name }). Runs on every boot so that editing the env
 * var is enough to add a user or reset a password. Idempotent.
 */
async function seedUsersFromEnv(client: Client) {
  const raw = process.env.PAISA_SEED_USERS;
  if (!raw) return;

  let list: SeedUser[];
  try {
    list = JSON.parse(raw);
  } catch {
    console.error("[paisa] PAISA_SEED_USERS is not valid JSON — skipping.");
    return;
  }
  if (!Array.isArray(list)) return;

  for (const u of list) {
    if (!u?.username || !u?.password) continue;
    const username = u.username.trim().toLowerCase();
    const name = (u.name ?? u.username).trim();
    const passwordHash = hashPassword(u.password);

    const found = await client.execute({
      sql: "SELECT id FROM users WHERE username = ?",
      args: [username],
    });

    if (found.rows.length > 0) {
      const id = found.rows[0].id as string;
      await client.execute({
        sql: "UPDATE users SET name = ?, password_hash = ? WHERE id = ?",
        args: [name, passwordHash, id],
      });
      await provisionDefaults(client, id);
    } else {
      const id = uuid();
      await client.execute({
        sql: `INSERT INTO users (id, name, username, password_hash, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [id, name, username, passwordHash, Date.now()],
      });
      await provisionDefaults(client, id);
    }
  }
}

async function init(client: Client) {
  await ensureSchema(client);
  await seedIfEmpty(client);
  await seedUsersFromEnv(client);
}

/**
 * Returns the Drizzle DB instance, running schema setup + user seeding exactly
 * once per process (memoized). Async because the libSQL/Turso client is async.
 */
export async function getDb() {
  const client = getClient();
  if (!_db) _db = drizzle(client, { schema });
  if (!_initPromise) _initPromise = init(client);
  await _initPromise;
  return _db;
}
