# Operations and deployment

Ethos AI is a Next.js App Router application whose route handlers are the platform API. Prisma connects those handlers to PostgreSQL. The separate FastAPI service is reachable only through authenticated Next.js AI proxy routes; browsers must not call it directly.

## Safe setup

Copy the root and web `.env.example` files to ignored local environment files. Copy `apps/ai-service/.env.example` to its ignored `.env`. Use independent long random values for the Neon cookie secret, AI service token, and payment sandbox signature secret. Neon Auth must have password, verification-email OTP, sign-in OTP, password-reset delivery, and an HTTPS callback origin configured.

`ENABLE_DEMO_AUTH`, `NEXT_PUBLIC_OFFLINE_DEMO`, and `OFFLINE_DEMO` default to false. Demo identities still authenticate normally. Deterministic AI/demo results are prohibited in normal production operation.

## Database migrations

Never use `prisma db push`, reset, or destructive migration commands against Neon. Create a Neon backup branch, apply the committed migrations to an isolated validation branch with `npx prisma migrate deploy --schema prisma/schema.prisma`, run integrity and end-to-end checks, then deploy the identical migration set to primary. Roll back application code first if needed; additive tables can remain. A destructive database rollback requires a reviewed forward migration or restoration from the retained Neon branch.

## Documents and AI

Documents are stored with opaque keys in the private `ethos-private-documents` bucket and served only after relationship authorization. Avatars are intentionally public profile images and accept JPEG/PNG bytes only. Storage encryption must be configured and verified at the provider; the application does not claim client-side encryption.

Set matching `AI_SERVICE_API_TOKEN` values on Next.js and FastAPI. Configure `AI_ALLOWED_ORIGINS` as a JSON array of trusted web origins; no wildcard is allowed. File/body limits are enforced by both services. Agency risk state requires PostgreSQL and is never process-local in production.

## Payments

Only the signed sandbox adapter exists. It requires `ETHOS_PAYMENT_MODE=sandbox` and a 32-character secret, and it refuses production. A real payment provider must remain disabled until its own initiation, server verification, signature, amount/currency reconciliation, idempotency, and settlement calls are implemented and tested.

## Verification

From `apps/web`, run `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, and `npm run test:e2e`. Recreate the Python environment from `apps/ai-service/requirements.txt` and run `pytest`; do not reuse a checked-in virtual environment. CI deploys migrations and seeds only to its disposable PostgreSQL service.
