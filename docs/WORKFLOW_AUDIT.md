# Workflow and Performance Audit

Audit date: 2026-10-04

This report distinguishes automated contract coverage from live acceptance. A passing mocked or integration test proves the application logic, but it does not prove that third-party credentials, deployed origins, storage, email delivery, or payment providers are configured in production.

## Executive result

- Web automated tests: **234 passed, 5 skipped** across 35 files.
- AI automated tests: **122 passed, 2 skipped**.
- Production-build browser tests: **7 passed**.
- Next.js production build and TypeScript: **passed**.
- Vercel Preview deployment: **ready** in `iad1` with public `web`, internal `ai-service`, and a web-to-AI service binding.
- Stable audited Preview URL: `https://ethos-ai-preview-parvez-ahmed-tasins-projects.vercel.app` (Vercel Authentication protection enabled; deployment `dpl_4VuWsrdXrk6WVZqdee6LTSH3trfW`, `iad1`).
- Live authenticated acceptance: **student, agency, and admin pass** on the stable Preview origin. Parent acceptance is pending a test account.
- Live payments: **not implemented**. The current bKash, Nagad, and SSLCOMMERZ paths are signed sandbox simulations only.
- Malware scanning: **not implemented**. Uploads do enforce size, MIME, and file-signature checks and use private object storage.

## Workflow matrix

| Workflow | Automated evidence | Deployed evidence | Result |
| --- | --- | --- | --- |
| Public landing, directory, comparison, agency detail | API tests, build, browser smoke | Public pages and `/api/agencies` return 200 | Pass |
| Campus/living-cost directory | Route tests and build | `/api/campus-living` returns 200 | Pass; displayed costs remain planning estimates unless explicitly audited |
| Password/OTP registration and login | Registration boundary tests and 3 browser auth scenarios | Student, agency, and admin password authentication succeeds on the stable Preview origin | Pass for three roles; parent pending |
| Student/parent/agency/admin authorization | Forged-role, RBAC, relationship, and session tests | Student, agency, and admin role routes enforce the correct destination | Pass for tested roles; parent pending |
| Guardian link request, approval, removal | Route and relationship authorization tests | No live authenticated run | Logic passes; acceptance pending |
| Student creates an application and selects agency packages | Six integration scenarios, including cross-agency and empty-package denial | Created `Codex E2E Test University` with Global Edu BD package | Pass live; creation took about 6 s |
| Application stage tracking | Persistence/state APIs compile and seeded records exist | Agency queue loads four linked applications and exposes valid next-stage controls | Pass read-only acceptance; no live stage mutation performed |
| Private document upload/download/delete | Storage and route tests; browser failure-state test | Student upload/download and agency-scoped vault navigation pass | Pass for upload/download/navigation; delete intentionally not exercised |
| Offer-letter and agreement analysis | Gateway/client contracts and 122 AI tests | Synthetic offer letter: 100/100 high risk; synthetic agreement: 88/100 high risk; vault PDF: 85/100 high risk | Pass live after verdict normalization fix; cold offer scan was 35.8 s |
| Student ↔ agency chat | Nine integration scenarios; optimistic UI; delta polling | Test message persisted; server acknowledgement took about 14.2 s | Pass functionally; latency remains poor |
| Community join/post/comment/like/direct message/report/block | Integration/database tests and full browser workflow | Canada join 3.4 s; post publish 1.9 s; persisted after reload | Pass for join/post/isolation; remaining mutations pending |
| Counselor shortlist and roadmap | Route tests | Seeded shortlist/roadmap records exist | Logic passes; live acceptance pending |
| Scholar live search and outreach | AI and web route tests | Outreach records exist | Logic passes; seeded demo data is now disabled in production |
| Sandbox escrow hold/release/refund/dispute | Payment service, route, signature, concurrency, and rollback tests | Preview-only sandbox enabled; exact ৳50,000 test milestone held via SSLCOMMERZ in 4.4 s; ledger increased 7→8 | Hold passes live; release/refund/dispute role checks pending |
| Real bKash/Nagad/SSLCOMMERZ settlement | None | None | Not implemented |
| Agency fee submission and admin approval | Persistence and authorization tests | Agency packages/submission history and Admin dossier queue load correctly | Pass read-only acceptance; no approval mutation performed |
| Complaints, verification reports, subscriptions, moderation reports | Schemas/routes are present in parts | Zero live records | Not proven end to end |
| Admin governance, disputes, risk alerts | Persistence/security tests and governance records | Agency dossiers, provenance queues, disputes, alerts, users, ledger, transcripts, and profile load live | Pass read-only acceptance; destructive/governance mutations intentionally not exercised |

## Performance measurements

Measurements were made from Bangladesh. Vercel Preview is protected, so the authenticated Vercel CLI was used; its protection handshake can add overhead.

| Operation | Cold | Warm |
| --- | ---: | ---: |
| Preview landing page | 2.09 s | 0.48–0.69 s |
| Preview auth status API | 1.26 s | 0.40–0.63 s |
| Preview agencies API | 1.88 s | 0.43–0.46 s |
| Preview campus-living API | 0.60 s | 0.43–0.59 s |
| Preview directory page | 0.59 s | 0.21–0.28 s |
| 41 sequential direct Neon queries from Bangladesh | — | 40.9 s total (~1.0 s/query) |

The direct Neon measurement explains the poor localhost experience: every sequential database round trip pays intercontinental latency. Running the web service in Vercel `iad1`, near the US-East Neon database, removes most of that server-to-database distance. For fast local development, use a local database or move/create a Neon branch in a nearer Asian region; moving only the browser cannot remove Bangladesh-to-US latency.

## Performance changes made

- Application creation fetches eligible agencies and their selectable pricing packages and validates every selected package server-side.
- Chat sends render optimistically instead of waiting for the server response.
- Chat polling uses delta cursors and no longer reloads the full conversation.
- Polling now schedules the next request only after the previous request completes, preventing overlapping request storms on slow connections.
- Thread list refresh runs every 12 seconds and pauses in hidden tabs.
- Chat thread access/cursor checks and initial message/count reads execute concurrently.
- Composite indexes were added for chronological thread reads and unread updates, and were applied to Neon.
- Unsafe Next.js output-tracing exclusions were removed so dynamic Vercel routes include their runtime dependencies.
- Community toast timers no longer race and erase a newer success/error message.
- Chat polling backs off after idle polls, pauses during sends, and slows further in hidden tabs.
- Vault scan verdicts are normalized across the AI and UI contracts, including legacy stored scan rows.
- AI upload requests now have a client deadline instead of spinning forever.
- Vercel Preview can run explicitly configured signed sandbox payments, while Production remains hard-disabled.
- Cross-role denials now redirect Agency and Admin users to their own canonical dashboards instead of the generic student dashboard URL.
- Agency document-vault links now target the deployed `/dashboard/documents` route instead of a 404.
- Admin communication transcripts are read-only and label student/agency senders correctly.

## Integrity corrections

- Production scholar endpoints no longer expose bundled professor/funding fixtures unless explicit offline-demo mode is enabled.
- OpenAlex profiles no longer invent email addresses, active grants, or student availability.
- Public copy no longer claims fabricated student, agency, success-rate, or protected-funds totals.
- Public copy now labels payments as sandbox-only and explicitly states that AI output requires human verification.
- Documentation no longer claims malware scanning or production payment gateways.
- Hardcoded fraud examples are labeled as synthetic training scenarios instead of a live blacklist.
- Vault reports no longer claim that issuer domains or layouts passed unless the scan returned supporting evidence.

## Remaining blockers and next acceptance run

1. Add the final Production domain to Neon Auth trusted origins before production authentication acceptance; the stable Preview origin is already trusted.
2. Provision or sign in a verified parent test account for the remaining live role matrix.
3. Continue mutation acceptance only with explicit test authorization: agency stage updates → guardian approval/view → admin review/dispute resolution.
4. Investigate remaining live latency: cold offer scan 35.8 s, chat acknowledgement 14.2 s, application creation about 6 s, and auth/data page loads up to about 7.5 s.
5. Replace sandbox gateways and add malware scanning before claiming either capability as production-ready.
6. The repository ESLint gate still reports pre-existing errors in campus, scholar, counselor, admin, and utility-script files even though build/type-check succeeds; clean these before making lint a required CI gate.
