# Paisa Tracker

Mobile-first personal finance tracker — **PRD.md follow kar** for product rules.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional — defaults work without this
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone (same Wi‑Fi) or use DevTools mobile view.

SQLite DB is created at `./data/paisa.db` on first request. Default seed: categories (PRD §6), HDFC / Cash / Credit Card accounts.

## MVP screens

| Route | Purpose |
|-------|---------|
| `/` | Net worth, today + month flow, safe-to-spend, budgets, accounts |
| `/transactions` | Ledger with month / in-out / search |
| `/accounts` | Multi-account balances + add account |
| `/budgets` | Monthly category limits |
| `/reports` | Daily breakdown + monthly analysis & tips |

**Quick add:** green **+** FAB — Kharch / Aaya / Transfer in ~3 taps.

## Core rules (short)

- Amounts in **paise** (integers)
- Transfers = paired rows, excluded from income/expense reports
- CC balance reduces net worth when type is `credit`

## PWA

Add to Home Screen via browser menu. Icons: replace `public/icon-192.png` and `public/icon-512.png` (optional — generate from your logo).

## Env

Template: [`.env.example`](.env.example) → copy to **`.env.local`** (Next.js auto-loads it; gitignored).

| Variable | Required? | Default | Use |
|----------|-----------|---------|-----|
| `DATABASE_PATH` | No | `./data/paisa.db` | App SQLite file |
| `DATABASE_URL` | No | `./data/paisa.db` | Drizzle Kit CLI |
| `PAISA_USER_ID` | No | `user-local-1` | Single-user id |

Auth keys, bank API, Claude, etc. abhi MVP mein nahi — P1/P2 (PRD) pe add honge.
