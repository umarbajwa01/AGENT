# CommercePilot AI — implementation contract

Single-store modular monolith, Node 24 / Express / MongoDB replica set / Redis. React JSX client talks only to /api/v1. All money is PKR paisa (integers). Mongo sessions hold opaque token hashes, TTL, CSRF secret and user reference. Customers use separate opaque browser sessions; customer identifiers never come from model arguments. Session renewal rotates and revokes the prior token.

## Trust boundaries

Browser → validated API → authorized service → transactional Mongo. WhatsApp raw signed bytes → durable inbox → BullMQ worker → bounded tool executor. AI is an untrusted language interface; prices and order creation remain deterministic. A quote is a persisted 10-minute snapshot; confirmation needs its ID and server-issued nonce. AI cannot synthesize that consent. Checkout atomically reserves stock, consumes quote/coupon, creates order/history/audit/outbox, and clears cart. Confirmation messages originate from the outbox after commit. Redis failure cannot roll back a committed order or lose an outbox record.

## Threat model

| Threat                   | Control                                                                     | Verification          |
| ------------------------ | --------------------------------------------------------------------------- | --------------------- |
| Price injection          | Ignore client prices; persisted quote and database variants                 | Tampered totals test  |
| Oversell/race            | Conditional available-stock decrement inside transaction                    | Concurrent order test |
| Duplicate submit         | Customer + idempotency key unique index, quote single use                   | Retry test            |
| IDOR                     | Customer ownership filters, staff role checks                               | Cross-customer test   |
| CSRF/session theft       | HttpOnly same-site cookie, origin + CSRF validation, token hashes, rotation | Auth/API tests        |
| Forged Meta webhook      | Raw-body HMAC, timingSafeEqual                                              | Signature tests       |
| Replay webhook           | Unique event key; durable inbox                                             | Duplicate test        |
| Prompt injection         | Allowlist, Zod, bounded loops, no arbitrary DB operations                   | Tool rejection tests  |
| Queue outage             | Transactional outbox + repeat dispatcher                                    | Outbox recovery test  |
| Staff account compromise | Argon2id, rate limits, TOTP in production, audit                            | Login tests           |

## Data relationships

User ↔ Session; Customer ↔ CustomerSession; Product → embedded variants (unique SKU index); Cart → embedded items; Quote → immutable item/fee/discount snapshots; Order → immutable items + embedded history; InventoryReservation → Order; InventoryMovement → variant/order. Conversation → Message; WebhookEvent → inbound worker; Outbox → outbound worker. Categories, zones, coupons, policies, settings, tickets, audit and usage have separate collections. Embedding cart/order items avoids independent orphan records. Indexes enforce unique references, webhook keys, sessions and checkout idempotency. Never TTL-delete active reservations: release stock in a transaction first.

## Scope and acceptance gate

The supplied requirements are the target, not a claim of completion. Each phase has a checkpoint in STATUS.md. Live Meta/OpenAI/courier/storage deployment requires owner credentials and an externally provisioned deployment. Sites Worker hosting cannot run this TCP Mongo/Redis Express stack unchanged; do not silently replace its database or present a static demo as this system.
