# Project structure

Start with the root README for setup and STATUS.md for unfinished features and release gates. This archive contains editable source. Generate browser assets with `npm run build`; install dependencies with `npm ci`.

## Frontend — client/src

| Path                    | Responsibility                                              |
| ----------------------- | ----------------------------------------------------------- |
| main.jsx                | Browser entry point, global styles and fonts                |
| App.jsx                 | Providers and top-level routes                              |
| layouts/AdminLayout.jsx | Admin navigation, shell and nested routes                   |
| pages/auth              | Sign-in screen                                              |
| pages/admin             | One screen per admin feature                                |
| pages/store             | Customer simulator and storefront                           |
| components/common       | Shared fields, tables, dialogs, pagination and error states |
| components/products     | Product form and variant editor                             |
| components/orders       | Reusable order table                                        |
| hooks/useApi.js         | Query and mutation hooks                                    |
| services/api.js         | HTTP requests, CSRF handling and money formatting           |
| lib/queryClient.js      | Shared query cache                                          |
| constants               | Navigation configuration and order status transitions       |
| utils                   | Small reusable formatting helpers                           |
| styles                  | Base styles and visual theme, imported through index.css    |

Pages compose reusable components. HTTP details stay in the API service; the server remains authoritative for pricing, permissions and checkout.

## Backend — server

| Path                  | Responsibility                                                                       |
| --------------------- | ------------------------------------------------------------------------------------ |
| src/server.js         | Database connection, startup and shutdown                                            |
| src/app.js            | HTTP middleware, health endpoints, webhook signature boundary and route registration |
| src/routes            | Feature-specific endpoint handlers                                                   |
| src/middleware        | Sessions, CSRF and authorization gates                                               |
| src/validators        | Shared request schemas                                                               |
| src/models            | Mongoose schemas grouped by domain; index.js exports the model collection            |
| src/services/orders   | Pricing, inventory reservation and transactional checkout                            |
| src/services/ai       | Assistant tools, bounded context and model interaction                               |
| src/services/whatsapp | Webhook ingestion and outbound messaging                                             |
| src/jobs/worker.js    | Queue processing and background work                                                 |
| src/config            | Logging and secret encryption helpers                                                |
| src/utils             | Audit, errors, pagination and cryptographic helpers                                  |
| scripts               | Development seed and MFA provisioning                                                |
| tests                 | Security unit tests and database integration tests                                   |

A normal request passes through middleware, a route handler, a domain service where needed, and a model. The WhatsApp POST endpoint receives the raw request body before JSON parsing so signature verification continues to work.

## Other folders

- `docs/`: architecture, API contract, operations, security, visual design and delivery status.
- `e2e/`: browser workflow tests.
- `.github/workflows/`: automated checks.
- Root configuration: workspace dependencies, local database containers, test runners and formatter rules.

## Making changes

1. Find the page and matching feature route. Keep shared UI in components and business rules in server services.
2. Add validation and authorization when introducing an endpoint. Update `docs/openapi.json` when the API contract changes.
3. Use `npm run format` for consistent formatting and `npm run build` to check the frontend.
4. Run the relevant tests against disposable data. Read STATUS.md for the database-test limitation observed in this delivery environment.

Keep credentials in a private `.env` based on `.env.example`. Generated assets, installed dependencies, local databases, logs and temporary test output are excluded from the source ZIP.
