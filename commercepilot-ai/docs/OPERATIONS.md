# Deployment and operations

## Topology

Use a supported Node 24 host for API and a separate worker process from the same release. MongoDB must support transactions and have authentication, TLS and restricted network access. Redis must have authentication/TLS and durable storage. Set production secrets in the host's secret manager, never in frontend variables or committed files. Serve Vite build output with a reverse proxy; example snippets are included. Do not use the localhost development compose file as a production deployment.

## Meta onboarding

Create a business app and WhatsApp Business Account, complete applicable business/number review, obtain a system-user token with only required permissions, and set the configured Graph API version. Register HTTPS webhook verification token, subscribe to messages, test signatures with the app secret and use official test recipients before real traffic. The POST endpoint records durable incoming events before acknowledging them. Run Redis + worker continuously. Outbound customer-service messages are allowed only within 24 hours of an inbound message; outside that window this implementation blocks and records the reason. No marketing campaign sender is implemented. Review current Meta commerce/messaging rules, consent requirements and rates before launch. No hardcoded free-message assumptions or guessed rates are used.

## OpenAI

Set API key and model in the server environment. Verify a real tool call in a staging conversation and inspect usage records. Messages/history can be transmitted to OpenAI when enabled; obtain the required privacy notice and retention configuration first. Store=false is used for Responses requests; this is not a blanket zero-retention claim. Hard daily budgeting under concurrency remains a release gate.

## MFA enrollment

Generate `MFA_ENCRYPTION_KEY` with 32 cryptographically random bytes encoded as hex. Store it in a secret manager and preserve a recoverable encrypted backup of the key. From a trusted operator terminal at the project root:

```sh
node --env-file=.env server/scripts/provision-mfa.js owner@example.com
```

The secret is shown only for manual authenticator enrollment and saved encrypted with AES-256-GCM after a valid code. Never redirect this command to production logs. No self-service recovery is implemented; design and test identity-verified recovery before launch. Production sign-in rejects privileged accounts that have not enrolled MFA.

## Monitoring and recovery

Monitor readiness `/health/ready`, liveness `/health/live`, API error rates, database transaction errors, oldest pending outbox/inbox age, failed BullMQ jobs, window-blocked sends and AI usage. The worker dispatches pending durable records every 10 seconds. Failed jobs after five attempts require operator inspection; do not blindly replay uncertain successful Meta sends because the remote API can have accepted a message before a network error.

Create encrypted daily backups and enable point-in-time recovery where supported. Restrict backup access. Monthly, restore into an isolated database and verify record counts, indexes, sample order totals and inventory reconciliation. Record the restore result and RPO/RTO; this delivery has not run a restoration exercise.

## Release and rollback checklist

- Run all database tests and browser E2E tests in staging; no skipped release tests.
- Test authentication, MFA enrollment, logout, CSRF, IDOR and staff permissions.
- Test stock races, retries, expiry, queue outage recovery, duplicate webhooks and customer opt-out.
- Review requirements gap list in STATUS; resolve all blockers for the intended channel.
- Use separate staging/production keys, databases and Meta test/real numbers.
- Confirm policies, delivery coverage and COD amounts with the business owner.
- Deploy versioned API/worker images together, then frontend. Check readiness before routing traffic.
- Keep the previous compatible image and static bundle. Roll back both app processes and frontend together. Do not restore an old database over new orders; prefer forward-compatible schema changes and a reviewed reconciliation migration.
- On compromise: disable external sends, revoke sessions, rotate tokens, preserve minimal audit evidence, identify impacted data, follow jurisdiction-specific notification guidance and document remediation.

## Primary references consulted

- https://nodejs.org/en/download
- https://developers.openai.com/api/docs/guides/function-calling
- https://developers.openai.com/api/reference/responses/overview
- https://business.whatsapp.com/policy
- https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api
- https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/ (signature contract reference only; the archived SDK is not used)
