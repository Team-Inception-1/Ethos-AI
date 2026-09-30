# Preserving the existing Neon database

Backup branch: `stabilization-backup-20260930` (`br-jolly-dream-axwk9y8j`).
Validation branch: `stabilization-validation-20260930` (`br-wispy-moon-axabxedi`).
Production: `br-withered-unit-axfbhtie`.

The read-only live schema snapshot is `prisma/baseline/live-20260930.sql`.
It is a reference, not a script to run over an existing database.

The old initial migration is not an exact description of live Neon: array
nullability/defaults, timestamp defaults and constraint names differ. Do not
silently mark that migration applied, or tighten existing nullable columns.
Production baselining is paused for review of those differences. No `db push`,
reset, drop, truncation or destructive reconciliation is permitted.

`20260930130000_add_platform_models` contains only the 12 missing platform
models, two peer messaging models, their four enums, indexes and foreign keys.
Existing tables and columns are not altered. Participant-order and report-target
checks reject invalid messaging/report data. Community reads derive counts from
related rows, so legacy illustrative counters cannot inflate them.

On an empty disposable database, normal `prisma migrate deploy` applies both
migrations. On existing Neon, first approve and reconcile the baseline/history;
never replay the original create-table migration on live tables.

Run `node prisma/seed-community.mjs` with an explicit `DATABASE_URL` and matching
`COMMUNITY_SEED_ALLOWED_HOST`. CI may use local `ethos_test` without that host
override. The default seed inserts missing country hubs only. Mentor/post/comment
examples require `ENABLE_DEMO_DATA=true`, are forbidden under production mode,
and never import fictional verification badges or fabricated activity counts.
All seed upserts leave existing rows unchanged. Do not use the old general seed
for production onboarding.

Before production deployment, compare old-table row counts, column definitions,
constraints and data integrity against the backup; run the complete integration
and browser flows on the validation branch. Keep the backup until rollout is
accepted. Rollback means reverting application code and retaining additive
tables; deleting tables or restoring production over newer user data needs a
separate reviewed recovery decision.

Prisma baselining guidance: https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining
