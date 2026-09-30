# Preserving the existing Neon database

Backup branch: `stabilization-backup-20260930` (`br-jolly-dream-axwk9y8j`).
Validation branch: `stabilization-validation-20260930` (`br-wispy-moon-axabxedi`).
Production: `br-withered-unit-axfbhtie`.

The read-only live schema snapshot is `prisma/baseline/live-20260930.sql`.
It is a reference, not a script to run over an existing database.

The old initial migration was not an exact description of live Neon: array
nullability/defaults, timestamp defaults and constraint names differed. The user
approved preserving existing columns and creating an accurate baseline. The
former SQL is archived in `prisma/baseline/original-init.sql`; the initial migration
now reproduces the live 19 application tables, excluding the unmanaged
`playing_with_neon` example table. There was no pre-existing migration history.
Both migrations are recorded as applied on validation and production. No
`db push`, reset, drop, truncation or destructive reconciliation is permitted.

`20260930130000_add_platform_models` contains only the 12 missing platform
models, two peer messaging models, their four enums, indexes and foreign keys.
Existing tables and columns are not altered. Participant-order and report-target
checks reject invalid messaging/report data. Community reads derive counts from
related rows, so legacy illustrative counters cannot inflate them.

On an empty disposable database, normal `prisma migrate deploy` applies both
migrations. On existing Neon, verify the corrected baseline, then mark only the
initial migration applied using `prisma migrate resolve --applied 20250101000000_init`.
Deploy the additive migration normally; never replay create-table baseline SQL
on existing tables. Production deployment completed after the real isolated-Neon
registration/community workflow and all six browser smoke flows passed. The
accurate baseline was marked applied; the additive migration was deployed using
Prisma Migrate. All 19 original table row counts are unchanged, including the
20 existing users and four existing document records. Migration status is up to
date. Production seed ran twice and produced six country hubs without demo
users, posts, comments, or fictional verified mentors.

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

The separately approved document-object migration preserved all four document
records and file bytes, changed their pointers to verified private copies, and
removed only the four verified public source objects. Recovery information is
in the ignored local migration manifest and the retained pre-migration branch.
Deploy the repair application's private-key reader with this change; the old
reader does not support the new storage namespace. Retain the backup and review
its object-storage access policy before final production acceptance.

Prisma baselining guidance: https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining
