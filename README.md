# Welcome Ticket – Deutschlandticket Portal (MVP)

A multilingual web portal for refugees and newcomers to order the
Deutschlandticket in 3 simple steps. Supports English and Arabic (RTL).
No bureaucratic language. Mobile-first.

## Tech stack

- **Next.js 15** (App Router, TypeScript)
- **SQLite via Prisma 7 + libsql adapter** (local dev)
- **i18n**: simple JSON dictionaries (`lib/i18n/en.json`, `lib/i18n/ar.json`)
- **Tests**: Vitest (unit/integration) + Playwright (E2E)

---

## Local setup

```bash
# 1. Clone and install
git clone https://github.com/lorenznitsch/mobilitybox-tryout-1.git
cd mobilitybox-tryout-1
npm install

# 2. Create .env.local from the example
cp .env.example .env.local
# Edit .env.local and set your values (see below)

# 3. Apply DB migrations
DATABASE_URL="file:./dev.db" npx prisma migrate deploy
DATABASE_URL="file:./dev.db" npx prisma generate

# 4. Start dev server
MOBILITYBOX_MODE=mock DATABASE_URL="file:./dev.db" npm run dev
```

Open http://localhost:3000 → click "Order now" to see the form.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite file path, e.g. `file:./dev.db` |
| `MOBILITYBOX_API_KEY` | Only in live mode | Your Mobilitybox API key (never commit!) |
| `MOBILITYBOX_MODE` | Yes | `mock` \| `mock-fail` \| `live` (see below) |

### MOBILITYBOX_MODE

| Value | Effect |
|---|---|
| `mock` | No real API calls. Realistic fake responses. **Use in all tests and local dev.** |
| `mock-fail` | Simulates an API failure. Useful for testing error screens. |
| `live` | ⚠️ Makes **real API calls**. See warning below. |

---

## ⚠️ LIVE MODE WARNING

Setting `MOBILITYBOX_MODE=live` with a valid `MOBILITYBOX_API_KEY` will
trigger **real Mobilitybox API calls** that can create **real, billable
49 €/month subscriptions**.

Before switching to live mode:
1. Contact Mobilitybox support at support@themobilitybox.com to request a
   **test/sandbox API key** that does not trigger real billing.
2. Only ever set `MOBILITYBOX_MODE=live` manually, never in code or tests.
3. Never commit `MOBILITYBOX_API_KEY` to the repository.

---

## Running tests

```bash
# Unit + integration tests (Vitest)
npm test

# E2E tests (Playwright) – starts the dev server automatically
MOBILITYBOX_MODE=mock DATABASE_URL="file:./dev.db" npm run test:e2e
```

All tests always run with `MOBILITYBOX_MODE=mock`. No real network calls are made.

---

## Deploying to Vercel

1. Push to GitHub (already done).
2. Import the repo at https://vercel.com/new.
3. Set environment variables in Vercel project settings:
   - `MOBILITYBOX_MODE=mock` (or `live` when ready – see warning above)
   - `MOBILITYBOX_API_KEY=<your key>` (only for live mode)
   - `DATABASE_URL=<your cloud DB URL>` (see note below)

### ⚠️ SQLite on Vercel

The Vercel filesystem is **ephemeral** – SQLite data is lost on every
deployment and serverless invocation. For real production use, switch to
a cloud database:

- **[Neon](https://neon.tech)** (PostgreSQL, free tier) – change
  `provider = "postgresql"` in `prisma/schema.prisma` and update the adapter.
- **[Turso](https://turso.tech)** (libsql, edge-compatible) – works with the
  existing `@prisma/adapter-libsql` adapter; just update `DATABASE_URL`.

Prisma makes the migration straightforward: update the schema provider and
connection string, then run `prisma migrate deploy`.

---

## Privacy note

Only the minimum personal data required for the Deutschlandticket is stored:
first name, last name, date of birth, and postal code. No payment data is
stored in this application.

---

## What is mocked / what is missing for production

| Feature | Status |
|---|---|
| Mobilitybox order chain | ✅ Mocked; works end-to-end in mock mode |
| Real Mobilitybox API | 🔲 Need live key (request sandbox from support) |
| Payment / billing | 🔲 Handled by Mobilitybox, not this app |
| Wallet integration (Apple/Google Pay) | 🔲 Placeholder only |
| Monthly reorder (subscription renewal) | 🔲 Not implemented |
| Photo / identity verification | 🔲 Using `photo_id_lite` (no photo); full verification not implemented |
| Persistent cloud database | 🔲 SQLite is local only; use Neon/Turso for Vercel |
| Additional languages | 🔲 EN + AR only; Arabic needs native-speaker review |
| Email delivery of ticket | 🔲 Not implemented |

> **Arabic strings notice:** The Arabic translations were generated
> programmatically and have not been reviewed by a native speaker. Please
> have them reviewed before using in production.
