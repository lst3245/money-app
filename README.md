# money-app
# Project Overview

A self‑hosted personal finance web app to track income & spending, optimized for fast entry on mobile (installable PWA) and full reporting on desktop. Supports recurring items, custom categories/payment methods, credit‑card cycles with statement & payment dates, and a special “charged vs personal share” model for group expenses.

---

## Goals & Non‑Goals

**Goals**

* Lightning‑fast “quick add” on mobile (one tap from home screen; offline capable; <2s end‑to‑end when online).
* Desktop & mobile responsive UI; installable PWA.
* Recurring items (RRULE‑style: daily/weekly/monthly/custom) for income and expenses.
* Rich metadata: categories, tags, merchant, payment method (cards, cash, bank), notes; all user‑definable.
* **Split-charge model**: separate the **card charge** amount from **your personal expense** amount (untracked remainder discarded).
* Credit cards: configurable statement date & payment due date. Monthly balance resets aligned to statements; reminders for due date.
* Data ownership: self‑hosted Docker; Postgres primary store; backup & export.
* Privacy & security: single-user by default; optional multi-user later.

**Non‑Goals (initial MVP)**

* Bank syncing / screen‑scraping connectors.
* Debt tracking for friends’ portions (remainder is intentionally ignored per requirements).
* Multi‑currency conversion (can be added later).

---

## Architecture

**Frontend (SPA + PWA)**

* **Next.js (App Router) + TypeScript**, rendered as SPA for speed; PWA plugin for manifest/service worker; Vite-powered dev experience via Turbopack.
* **UI**: TailwindCSS + shadcn/ui; lucide-react icons.
* State: React Query (TanStack) for server cache; Zustand for local quick‑add form state.
* Offline: Service Worker caches shell & API; Background Sync queue for pending entries.

**Backend API**

* **Node.js (NestJS) + TypeScript**
* **PostgreSQL** for relational data; **Prisma ORM**.
* **BullMQ + Redis** for recurring job expansion & reminder notifications.
* Auth: Cookie or JWT (single-user secret by default). CSRF protection if cookies.
* Validation: Zod/DTO validation at boundaries.

**Deployment (Docker Compose)**

* Services: `web` (static Next.js), `api`, `db` (Postgres), `redis`, `worker` (cron/queues), optional `proxy` (Caddy/Traefik) for TLS.
* Daily pg\_dump backups to volume; healthchecks; migrations on boot.

---

## Data Model (initial)

* **User**(id, email, password\_hash?, tz, currency, created\_at)
* **Category**(id, user\_id, name, type: "expense"|"income", color, sort\_order)
* **PaymentInstrument**(id, user\_id, type: "credit\_card"|"debit"|"cash"|"bank", name, last4?, issuer?, **statement\_day** \[1–28 or "EOM"], **payment\_day** \[1–28 or offset], credit\_limit?, active)
* **Merchant**(id, user\_id, name)
* **Transaction**(id, user\_id, date, **amount\_charged**, **amount\_personal**, direction: "expense"|"income", category\_id, payment\_instrument\_id, merchant\_id, notes, tags\[], created\_at)

  * `amount_personal` is what counts toward your spending/income analytics.
  * `amount_charged` is what impacts the card’s cycle/balance.
* **RecurringTemplate**(id, user\_id, direction, **amount\_charged**, **amount\_personal**, category\_id, payment\_instrument\_id, merchant\_id, notes, tags\[], **rrule**, start\_date, end\_date?)
* **CardCycle**(id, payment\_instrument\_id, period\_start, period\_end, statement\_generated\_at, due\_date, opening\_balance, closing\_balance)
* **Reminder**(id, user\_id, kind: "card\_due"|"custom", run\_at, payload)
* **Budget** (optional v1.1): per-category monthly caps & alerts
* **NotificationSubscription** for Web Push (endpoint, keys)

**Notes**

* Recurrence engine expands `RecurringTemplate` into concrete `Transaction` rows on schedule, idempotent using a composite key (template\_id + occurrence date).
* Card cycles: derive `period_start/end` monthly via statement\_day; compute balances from `amount_charged` only.

---

## Key Behaviors & Specs

### 1) Quick Add (mobile-first)

* Floating action button → sheet with: Amount, Direction (Expense/Income), Category (predict last used), Payment Method (defaults to last used), Merchant (typeahead), **Personal share** field.
* If **Personal share** empty → equals **Charged** by default. If provided (< charged), analytics use personal; card balance uses charged.
* One-swipe save; vibration feedback; offline queue.

### 2) Recurring Items

* Templates support monthly on specific day, weekly on weekdays, every N days, or full RRULE (e.g., `FREQ=MONTHLY;BYMONTHDAY=1`).
* Edit template updates future occurrences; past records remain immutable unless explicitly bulk-edited.

### 3) Card Cycles & Reminders

* Configure each card: `statement_day` and `payment_day` (either absolute day of month or offset from statement).
* System auto-creates a `CardCycle` each month, snapshots the cycle’s `closing_balance` from **amount\_charged** sums.
* Reminder scheduled for due date with optional Web Push + email (SMTP envs or disable).
* “Pay card” action creates a zero-effect transaction (for history) and marks cycle as paid; **does not** affect analytics.

### 4) Categories/Methods/Merchants

* Fully user-managed dictionaries with sort order and colors; quick-create from Quick Add.

### 5) Reports & Views

* Dashboard: This month’s personal spend vs income, by category; upcoming card dues.
* Transactions list: powerful filters (date range, category, payment method, merchant, text, has-split).
* Cards view: current cycle balance, statement date, due date, history.
* Recurring view: calendar-like list of upcoming expansions.
* Export: CSV for transactions (both amounts), categories, payment methods.

---

## API Surface (selected endpoints)

`POST /auth/login`, `POST /auth/setup` (first user), `POST /auth/logout`

`GET /me`

**Taxonomies**

* `GET/POST/PATCH/DELETE /categories`
* `GET/POST/PATCH/DELETE /payment-instruments`
* `GET/POST/PATCH/DELETE /merchants`

**Transactions**

* `GET /transactions?from=&to=&category=&instrument=&q=&limit=&cursor=`
* `POST /transactions {date, direction, amount_charged, amount_personal, category_id, instrument_id, merchant_id, notes, tags}`
* `PATCH /transactions/:id`
* `DELETE /transactions/:id`

**Recurring**

* `GET /recurring-templates`
* `POST /recurring-templates {… , rrule}`
* `POST /recurring/run` (manual expand)

**Cards**

* `GET /cards/cycles?instrument_id=&from=&to=`
* `POST /cards/:id/pay` (marks cycle paid)

**Reminders/Notifications**

* `GET /reminders`
* `POST /reminders`
* `POST /push/subscribe`

---

## UX Sketch (pages)

* **/ (Dashboard)**: KPI cards; donut by category; list of upcoming card dues.
* **/add (Quick Add)**: dedicated ultra-fast screen; also a modal everywhere.
* **/transactions**: table/list with filters, infinite scroll.
* **/recurring**: manage templates.
* **/cards**: per-card cycles & settings.
* **/settings**: categories, payment methods, merchants, backups, notifications.

**Mobile**: bottom tab bar (Home, Add, Transactions, Cards, Settings). Install banner + “Add to Home Screen” tip.

---

## PWA Details

* `manifest.json`: name, icons, theme, `display: standalone`, start\_url `/add` on mobile for instant entry.
* Service Worker: precache app shell, runtime cache for API (Stale‑While‑Revalidate), Background Sync for queued POSTs.
* Web Push (optional): VAPID keys; permission gating; in-app notification center fallback.

---

## Security & Privacy

* HTTPS via reverse proxy; HSTS.
* Single‑tenant secret config via env vars. Default admin account on first run.
* Passwords hashed (argon2). Optional passkey (WebAuthn) later.
* Input validation & rate limiting; audit log for auth events.

---

## DevOps & Docker

**docker-compose.yml (sketch)**

```yaml
version: "3.9"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: money
      POSTGRES_USER: money
      POSTGRES_PASSWORD: money
    volumes:
      - dbdata:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck: { test: ["CMD-SHELL","pg_isready -U money"], interval: 10s, timeout: 5s, retries: 5 }

  redis:
    image: redis:7
    volumes: [redisdata:/data]

  api:
    build: ./api
    env_file: .env
    depends_on: [db, redis]

  worker:
    build: ./api
    command: ["node","dist/worker.js"]
    env_file: .env
    depends_on: [api]

  web:
    build: ./web
    depends_on: [api]

  proxy:
    image: caddy:2
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddydata:/data
      - caddyconfig:/config
    ports: ["80:80","443:443"]
    depends_on: [web, api]

volumes:
  dbdata:
  redisdata:
  caddydata:
  caddyconfig:
```

**Migrations & Backups**

* Prisma migrations auto-run on `api` start.
* Nightly cron in `api` or sidecar to `pg_dump` → `./backups/yyyymmdd.sql.gz`.

---

## Acceptance Criteria (MVP)

1. Add, edit, delete transactions with both **charged** and **personal** amounts.
2. Create recurring templates that auto-generate transactions monthly/weekly/daily.
3. Configure a credit card with `statement_day` and `payment_day`; see cycle balance (from charged sums) and receive a due reminder.
4. Mobile PWA installable; quick add available offline; queued entries sync when online.
5. CSV export; full‑text search & filters in transactions.
6. Docker Compose up → app reachable behind TLS proxy with env-configurable base URL.

---

## Nice‑to‑Haves (post‑MVP)

* Budgets per category with progress bars & alerts.
* Keyboard shortcuts on desktop; smart defaults based on history.
* Merchant suggestions & favorite amounts.
* Attach receipts (S3/minio).
* Multi-user with shared wallets.
* Multi-currency.

---

## Open Questions (for your preference)

* Auth mode: single-user only (simpler) vs multi-user (accounts)?
* Email delivery: do you have SMTP creds, or prefer push-only reminders?
* Default currency & timezone (we can auto-detect; configurable in settings).
* Any reporting you care about most (e.g., monthly net, by category, by card)?

---

## Next Steps

* Confirm or tweak the plan (data model, split-charge logic, PWA start page, card rules).
* I’ll scaffold the repo (web/api), wire Docker, and deliver an MVP you can run with `docker compose up -d`.
* Iteratively add budgets, reports, and niceties.
