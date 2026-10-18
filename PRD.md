# PRD: Paisa Tracker (working name)

> **Cursor instruction:** Har phase / feature prompt mein likho: **PRD.md follow kar.**

## 1. Problem

Paisa kahan jaa raha hai pata nahi chalta. Multiple bank accounts, UPI, CC, cash, sab alag jagah. Ek jagah "abhi kitna hai, kitna aaya, kitna gaya" nahi dikhta.

## 2. Goal

Ek number aur ek screen: **abhi total paisa kitna hai, aaj kitna kharch kar sakta hu.**

**Success metrics**

- Daily entry mein 10 sec se kam
- App balance = bank balance (reconcile mismatch ~0)
- Mahine ke end mein savings rate pata ho

## 3. User

Abhi sirf tu (single user). Multi-user baad mein, isliye `userId` har table mein rakh.

## 4. Core logic (rules jo kabhi nahi tootne chahiye)

| # | Rule |
|---|---|
| 1 | Account balance = opening + sum(IN) - sum(OUT) |
| 2 | Net worth = sab accounts ka balance sum (CC negative) |
| 3 | **Transfer income/expense nahi hai.** 2 linked rows (OUT + IN), reports mein ignore |
| 4 | CC swipe = expense us din. CC bill payment = transfer |
| 5 | Amount integer paise mein, float nahi |
| 6 | Mahine ka Net = Income - Expense (transfers exclude) |
| 7 | Daily safe-to-spend = (total budget - spent) / bache din |
| 8 | Savings rate = Net / Income × 100 |
| 9 | Reconcile mismatch pe "adjustment" entry, silently balance mat badal |

## 5. Features

**MVP (P0)**

- Accounts + opening balance
- Quick-add: amount, In/Out/Transfer, category, account, date
- Transactions list + filter + edit/delete
- Dashboard: total balance, month In/Out/Net, category vs budget, last 10
- Monthly budget per category

**P1**

- CSV import + duplicate check
- Auto-categorize rules (merchant → category)
- Transfer auto-detect
- Recurring entries (rent, Netflix, wifi)
- Reconciliation

**P2**

- SMS/Gmail alert auto-parse
- Subscription/leak detector
- Goals (emergency fund = 6 months expenses)
- Side-project P&L (revenue, infra, tools cost, profit)
- Claude API categorization

## 6. Categories

- **Expense:** Rent/Home, Groceries & Food, Transport/Fuel, Bills/Phone/Internet, Family Support, EMI/Debt, Shopping, Entertainment/Eating Out, Health/Personal Care, Subscriptions, Misc/Buffer
- **Income:** Salary, Freelance, Side projects, Refund/Cashback, Other

## 7. Screens

| Screen | Content |
|---|---|
| Home | Total balance, account list, month In/Out/Net, safe-to-spend, budget bars |
| Add (sheet) | 3-tap entry, defaults: aaj, last account |
| Transactions | List, filters, search |
| Accounts | List, balance, reconcile |
| Budgets | Category-wise limit vs spent |
| Reports | Month-over-month, top merchants, savings rate |

## 8. Data model (high level)

`User → Account → Transaction ← Category`, `Budget(category, month, limitPaise)`, `Rule(match, category)`, `Recurring(template, frequency)`

Transaction: `id, userId, accountId, date, amountPaise, direction (IN/OUT/TRANSFER), categoryId, merchant, note, transferGroupId, source (manual/csv/sms)`

## 9. Edge cases

- Cash withdrawal = ATM account se Cash account ko transfer
- Refund = IN ke saath original category, expense reduce kare
- Backdated entry = balance auto-recalculate
- Duplicate import = date + amount + narration match pe skip
- Split transaction (ek bill, 2 category) = P1 mein, abhi skip

## 10. Non-functional

- Mobile-first PWA
- Auth + DB encrypted at rest
- Bank login/password kabhi store nahi (sirf statement/alerts)
- Data export (CSV) hamesha available

## 11. Out of scope (v1)

Bank API/Account Aggregator, multi-user, investments tracking, bill splitting

## 12. Build order

Schema → Accounts → Quick-add → Dashboard → Budgets → Import → Recurring → PWA → SMS parse
