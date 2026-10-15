# CommercePilot AI

A React (JavaScript/JSX) + Express/MongoDB development implementation of a single-store COD sales workspace. Frontend design uses UI/UX Pro Max guidance. **This is a development delivery, not a verified production release.** Read `docs/STATUS.md` before deploying or using real customer data.

## Code organization

See [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the folder map and contribution workflow. Frontend pages, shared components and API hooks are separate; backend routes, middleware, models and domain services are grouped by responsibility. Run `npm run format` for consistent formatting.

## Included

- Responsive login, overview, products/variants, inventory adjustments, JSON import, categories, orders and timeline, payment recording, customers, inbox/human takeover, delivery zones, coupons, staff, analytics, policies/settings and audit screens.
- TanStack Query loading/error states and cache refresh, React Hook Form + Zod product/login forms, Recharts using stored data. Light/dark theme; no fictional sales metrics.
- Server-only pricing and delivery calculations; persisted 10-minute quotes; explicit COD confirmation; idempotent transactional checkout; stock reservation and cancellation release; transactional notification outbox.
- Argon2id, opaque hashed sessions, CSRF, role/ownership checks, throttling, encrypted TOTP secret enrollment and production MFA login gate.
- OpenAI Responses tool loop, validated allowlist, bounded context and deterministic fallback. Official Meta signature verification and durable webhook inbox; BullMQ dispatcher/worker; outbound text service-window gate.
- Customer simulator using the real API. It is not a browser-only fake checkout. No external API credentials are included.

## Windows / VS Code setup

### Existing setup: one-command startup (PowerShell)

Keep Docker Desktop running, then run:

```powershell
cd C:\Users\123\Downloads\CommercePilot_AI_Development\commercepilot-ai
npm.cmd run local
```

This waits for the local databases, seeds missing development records using your existing `.env`, then starts the API, frontend and worker together. Open `http://localhost:5173` and log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Existing records are preserved by the seed; changing the password in `.env` does not reset an existing account. Use `npm.cmd` in PowerShell if script execution policy blocks `npm.ps1`.

Press Ctrl+C to stop the app processes. Stop the databases with `docker compose stop`; their data remains in Docker volumes. The first launch downloads the database images and needs internet access. If a download fails, rerun the command.

1. Install Node.js **24 LTS**, Docker Desktop (for local MongoDB replica set and Redis), and open this extracted folder in VS Code. Alternatively use your own managed MongoDB replica set and Redis.
2. In the terminal, run:

```powershell
npm ci
Copy-Item .env.example .env
```

3. Edit `.env`: set your own `ADMIN_EMAIL` and strong `ADMIN_PASSWORD` (14+ characters). Keep all secrets private. The defaults for MongoDB/Redis match the local development containers. **MongoDB Compass is a database client; installing Compass alone does not start MongoDB.**
4. Start the databases, then seed and launch:

```powershell
docker compose up -d
npm run seed
npm run dev
```

5. Open `http://localhost:5173`. Sign in using the credentials you entered. In a second terminal start the queue worker:

```powershell
npm run worker -w server
```

6. Open `http://localhost:5173/simulator` in a private/incognito window to act as a customer while the regular window stays logged in as admin. Browse products → Add → Review COD checkout → enter delivery details → Get final quote → Confirm COD order. Return to admin Orders to confirm the request.

If `npm run seed` cannot connect, check `docker compose ps` and `docker compose logs mongo`. Transactions require a replica set; a standalone MongoDB server will not work. The local compose file binds unauthenticated databases only to localhost and is **not production infrastructure**.

## AI and WhatsApp

Set `OPENAI_API_KEY` and `OPENAI_MODEL` to a model available to your API account, then restart the API/worker. Without both, the simulator identifies its deterministic catalog fallback. ChatGPT subscriptions do not substitute for API credentials.

For Meta, set `META_TOKEN`, `META_PHONE_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` and a currently supported `META_API_VERSION` (for example the version shown in your Meta app; do not guess). Configure the HTTPS callback `/api/v1/webhooks/whatsapp`. Follow `docs/OPERATIONS.md`. A configured variable does not prove a live integration works.

**Current limitation:** full checkout is available through the web simulator. WhatsApp conversational checkout/confirmation buttons and template administration are not complete. Outside the customer-service window, text sends are blocked and retained for review; the app does not substitute an unapproved template.

## Commands

```sh
npm run build                     # Vite production assets
npm test                          # isolated MongoDB integration + unit tests
npm test -- server/tests/security.unit.test.js --pool=threads --maxWorkers=1
npm run test:e2e                   # requires running seeded app and Playwright browser
npm audit --omit=dev
```

Integration tests download MongoDB 7.0.24 for an isolated replica set. Alternatively set `TEST_MONGODB_URI` to a disposable replica-set database whose name contains `commercepilot_test`. **Tests delete all model records in that database. Never point them at real data.**

E2E: run `npx playwright install chromium` on your own machine, start the seeded app against a disposable development database, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the test process environment, then `npm run test:e2e`. The test is skipped if credentials are absent.

## Production and deployment

Run behind HTTPS with a same-origin reverse proxy serving `client/dist` and forwarding `/api` to Express. Set `NODE_ENV=production`, HTTPS `APP_ORIGINS`, and `ENABLE_SIMULATOR=false`. Provision user MFA before sign-in. Do not use the development seed in production. Initial production owner creation needs a reviewed bootstrap procedure; no public owner-registration endpoint is exposed.

This Express/MongoDB/Redis stack requires a Node server and TCP database access. It is not directly compatible with Cloudflare Worker-only Sites hosting. No deployed URL or live integrations are claimed in this delivery.

Read `docs/ARCHITECTURE.md`, `docs/openapi.json`, `docs/OPERATIONS.md`, `docs/SECURITY.md`, and especially `docs/STATUS.md` for the remaining release gates.
