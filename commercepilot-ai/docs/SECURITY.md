# Security and data handling

## Implemented boundaries

- Browser requests cannot supply actual prices, stock, totals, roles or customer IDs to checkout.
- Opaque cookies are HttpOnly and SameSite=Strict; Secure in production. Tokens are SHA-256 hashed at rest, time-limited and rotated on renewal. CSRF token is required on authenticated mutations.
- ADMIN can manage store records. SALES_AGENT currently has only assigned conversation access and sending after human takeover; unimplemented order permissions deny by default. CUSTOMER sessions can access their own cart/quotes/orders. There is no SUPER_ADMIN interface.
- Model tools cannot approve refunds, modify security settings, run code or create arbitrary orders. The current AI allowlist deliberately omits order creation: customer confirmation uses the deterministic checkout endpoint. This means full conversational checkout is not yet implemented.
- Webhook signature uses raw bytes, HMAC-SHA256 and constant-time comparison. An event key unique index prevents repeated ingestion records. A queue replays durable pending work after outages. Exactly-once external sending is not guaranteed by Meta or this worker.
- Pending order reservations expire after 24 hours and the worker cancels/restores them transactionally. Confirmed orders remain reserved until shipment or cancellation. Returned items are not automatically resold; staff must inspect them and apply an audited inventory adjustment.
- API logs omit request bodies and use safe error output. TOTP secrets use AES-256-GCM with an environment key; API credentials are never placed in documents or frontend code.

## Retention proposal — requires business review

Session TTL is 8 hours. Quote expiry is 10 minutes but quote records are not automatically deleted. Proposed retention: expired unused quotes 30 days, chat bodies 90 days, processed webhook bodies 30 days, operational logs 30 days. Orders and financial/audit records require a jurisdiction-appropriate retention period. **Automated retention, data-subject export/deletion and legal-hold workflows are not implemented.** Before deployment, implement a reviewed batch job that deletes/pseudonymizes only eligible records and never removes active reservations without releasing inventory transactionally. Backups need matching retention and deletion policies.

## Known release risks

Rate limiting is in-memory per API process, not shared across replicas. AI budgeting is checked from usage logs and can exceed the configured budget under simultaneous requests. TOTP replay prevention, recovery codes, lockout auditing and self-service session management need completion. Inbound retry can repeat AI side effects if a worker crashes after processing but before marking an event done. Outbound uncertain sends need reconciliation. Product image URLs are supported, but controlled file upload/storage, MIME validation and file scanning are not implemented. Restore, outage and live-provider tests remain required.

Do not describe this repository as OWASP-certified, legally compliant, penetration-tested or production-ready.
