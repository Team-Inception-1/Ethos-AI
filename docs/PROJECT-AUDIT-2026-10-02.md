# Ethos AI Project Audit — 2026-10-02

Scope: static trace of every visible feature through UI, API, Prisma, and storage layers, plus the available web quality gates. This is a defect inventory, not a claim that dynamic production dependencies or every browser/device combination were exercised.

## Executive summary

- The production build succeeds and the web unit/integration suite passes on a clean rerun: 193 passed, 5 skipped. The skipped tests are the database-dependent suites.
- ESLint fails with 3 errors and 3 warnings, all currently in `ChatPage.tsx`.
- The Python test suite could not be run because no Python runtime is installed on this machine.
- The largest architectural defect is split sources of truth. Several screens appear live but read static JSON/TypeScript data or browser storage while related PostgreSQL models/routes either exist separately or are not connected.

## Critical and high-priority defects

| ID | Area | Defect and impact | Evidence |
|---|---|---|---|
| AUD-001 | Agency directory | The directory list is read from PostgreSQL, but an agency detail page reads `src/data/agencies.ts`. A database agency can therefore show stale/different detail data. An unknown ID silently shows the first static agency instead of 404, which can display the wrong company. | `DirectoryPage.tsx:101-114`, `app/directory/[id]/page.tsx:8,18-20` |
| AUD-002 | Agency comparison | Comparison is entirely based on the static agency catalog and is disabled outside explicit offline-demo mode, even though the directory has a live PostgreSQL endpoint. IDs and values can disagree with the live directory. | `ComparePage.tsx:9-16,36-47,127-139` |
| AUD-003 | Counselor data flow | The Counselor UI never calls `/api/counselor/recommendations`. In normal mode it calls the AI-service live-discovery endpoint, so the new Neon-backed recommendation route is disconnected from the feature. | `CounselorPage.tsx:368-372`; no client reference to `/api/counselor/recommendations` |
| AUD-004 | Counselor schema | The untracked counselor API reads fields such as `city`, `fieldTags`, `minimumGpa`, and `submittedByAgencyId`. The untracked SQL migration adds them, but `schema.prisma` does not define them. The currently generated client happens to compile, but the next `prisma generate` from the committed schema will remove those fields and break the route. | `api/counselor/recommendations/route.ts:28-38,63-66`; `schema.prisma:884-912`; migration `20260930224500_verified_counselor_catalog` |
| AUD-005 | Counselor persistence | Tracked universities, shortlist records, and roadmap completion are stored only in `localStorage`; they are not account-bound, do not sync across devices, and disappear when browser data is cleared. | `CounselorPage.tsx:108-117,148-161,282-327` |
| AUD-006 | Counselor correctness | The DB recommendation route accepts degree, intake, scholarship priority, MOI-only preference, and study-gap limits, but most are not used in filtering/scoring. It can recommend programs that violate the user's stated constraints. | `api/counselor/recommendations/route.ts:7-15,53-90` |
| AUD-007 | Counselor labeling | DB-backed recommendations are returned with `data_source: "verified_database"` but `is_live_grounded: false`. The UI interprets any false value as an offline static demo and displays the wrong warning/labels for verified DB records. | `api/counselor/recommendations/route.ts:91-92,133-150`; `CounselorPage.tsx:493,792-795` |
| AUD-008 | Scholar Finder | The outreach pipeline is browser-only even though `Professor` and `ProfessorOutreach` PostgreSQL models exist. No application code reads or writes those models. Stages, drafts, notes, and follow-up dates therefore never reach Neon. | `ScholarFinderPage.tsx:201-203,262-272,618-629`; `schema.prisma:599-653` |
| AUD-009 | Guardian/parent access | `profileDTO` returns linked relationship IDs, but `AuthContext` always exposes empty `linkedStudents`/`linkedParents`; `linkStudent` always fails and `unlinkStudent` is a no-op. Parent Dashboard therefore always shows no relationships, even when approved links exist in PostgreSQL. | `auth/profile.ts:14-15`; `AuthContext.tsx:209-215`; `ParentDashboard.tsx:9-25` |
| AUD-010 | Agency profile | The agency profile form sends `agencyDetails`, but `/api/user/me` does not accept that field. Zod strips it, the API still succeeds, and the UI reports success although agency name/license/countries were not saved. | `ProfilePage.tsx:123-137`; `api/user/me/route.ts:8-17,29-39` |
| AUD-011 | Parent document vault | The document detail authorization supports relationships, but the document list always filters `ownerId` to the current user. A parent following “Authorized documents” cannot see an approved student's documents. | `api/documents/route.ts:15-24`; `ParentDashboard.tsx:27-30` |
| AUD-012 | Agency documents | Uploading a document with an application ID requires the current user to be the application's student. Agencies can upload standalone files but cannot associate them with the applications they manage, despite the agency dashboard linking to the vault. | `api/documents/route.ts:50-54`; `AgencyDashboard.tsx:133,169` |
| AUD-013 | Application chat creation | Creating an application creates events and milestones but not its `ChatThread`. Although a thread-creation API exists, no UI/client calls it. New applications therefore have no conversation and the UI offers no way to start one. | `api/applications/route.ts:78-102`; `api/chat/threads/route.ts:31-45`; no POST client call to `/api/chat/threads` |
| AUD-014 | Chat attachments | The attachment picker uses four hard-coded filenames as IDs rather than querying `/api/documents`. The message API requires a real document ID attached to the same application, so these attachments are rejected. | `ChatPage.tsx:122-127,242-280`; `api/chat/threads/[id]/messages/route.ts:44-53` |
| AUD-015 | Chat delivery | When the server rejects a send, the optimistic message is deliberately kept in the conversation with a fabricated hash. Users see an unsaved message as if it was delivered; refresh then removes it. | `ChatPage.tsx:255-287` |
| AUD-016 | Dispute evidence | If transcript export fails, the client fabricates a “CERTIFIED_CHAT_TRANSCRIPT”, “tamperEvident: true”, and a `...VERIFIED` signature from local state. This is misleading and unsafe for a dispute workflow. | `ChatPage.tsx:292-327` |
| AUD-017 | Chat navigation | Application Detail links with `?thread=...`, while Chat reads only `?threadId=...`; the intended conversation is not selected. Agency profiles link with `?agency=...`, which Chat ignores entirely. | `ApplicationDetailPage.tsx:156`; `ChatPage.tsx:167-192`; `app/directory/[id]/page.tsx:94` |
| AUD-018 | Chat completeness | The feature is not real-time: messages are fetched only when the selected thread changes. There is no polling/WebSocket/SSE, no read-receipt update, and the client ignores pagination beyond the newest 200 messages. Unread counts remain stale and older history is inaccessible in the UI. | `ChatPage.tsx:178-231`; `chatClient.ts:50-54`; `api/chat/threads/[id]/messages/route.ts:20-31` |
| AUD-019 | Payments | No live gateway exists. `requireSandbox()` rejects production unconditionally, so payment, release, and refund operations advertised by the production UI return 503 until a real provider is implemented. | `payments/sandbox.ts:17-23`; `payments/service.ts:22-24,112-125` |
| AUD-020 | Payment navigation | Compare's “Apply with Escrow” goes to `/dashboard/payments?agency=...`, but Payments does not read that query parameter and cannot begin an application/payment for the selected agency. | `ComparePage.tsx:459-463`; no search-param handling in `PaymentsPage.tsx` |
| AUD-021 | Campus Living | Both the UI and `/api/campus-living` read bundled `campusLivingData.json`; the page does not even call that API. Housing, area prices, and exchange rates are not stored in Neon and cannot be administered without a deployment. | `CampusLivingPage.tsx:7,41-64`; `api/campus-living/route.ts:2,15-35` |

## Medium-priority defects and inconsistencies

| ID | Area | Defect and impact | Evidence |
|---|---|---|---|
| AUD-022 | Notifications | Production notifications are always empty. Offline-demo notifications and read state are hard-coded/in-memory, with no database/API model, so they reset on reload. | `TopBar.tsx:11-113,131-137` |
| AUD-023 | Domain coverage | PostgreSQL models for reviews, complaints, verification reports, subscriptions, professors, and professor outreach have no feature API/repository usage. The schema suggests implemented capabilities that the product cannot create or manage end to end. | `schema.prisma:174-196,524-653`; no matching Prisma usage in `src` |
| AUD-024 | Profile trust claims | “Verified Account” is rendered unconditionally, including for unverified users. The page also claims “SHA-256 Cloud Vault Encryption” although uploaded documents are explicitly stored with `isEncrypted: false`; SHA-256 is not encryption. | `ProfilePage.tsx:173-175,203-216`; `api/documents/route.ts:59-62` |
| AUD-025 | Chat trust claims | The UI claims end-to-end encryption, “SHA-256 Tamper Proof”, and “Tribunal Admissible”. The implementation provides transport security plus ordinary database rows and a digest; the server itself notes that the digest is not a certified signature/legal attestation. | `ChatPage.tsx:344-358`; `api/chat/threads/[id]/export/route.ts:19-22` |
| AUD-026 | Application success message | Application creation can produce zero milestones when an agency has no pricing services, yet the UI always says “its escrow milestones are ready.” | `api/applications/route.ts:56-60,90-96`; `ApplicationsPage.tsx:65-67` |
| AUD-027 | Document deletion consistency | The object is deleted before its database row. If the database delete fails afterward, Neon retains a document record whose file no longer exists. | `api/documents/[id]/route.ts:29-33` |
| AUD-028 | Avatar lifecycle | Replacing an avatar uploads a new object and updates the URL but never deletes the previous object, causing unbounded orphaned storage. | `api/user/avatar/route.ts:20-25`; `storage.ts:150-162` |
| AUD-029 | CSRF consistency | Several cookie-authenticated mutations lack the explicit same-origin guard used by registration, community, documents, applications, and payments. Affected groups include admin mutations, agency mutations, chat POSTs, provenance mutations, and `/api/user/me` PUT. SameSite cookies reduce some risk but do not replace consistent origin enforcement, especially for same-site sibling origins. | State-changing routes under `api/admin/**`, `api/agency/**`, `api/chat/**`, `api/provenance/**`, and `api/user/me/route.ts` |
| AUD-030 | Page access UX | `/admin`, `/admin/chat`, `/agency/dashboard`, and related profile/chat pages are not wrapped in a role boundary. Their APIs reject unauthorized data access, but an unauthorized visitor still receives the full portal shell and repeated error states rather than an immediate access-denied/redirect experience. | `app/admin/page.tsx`; `app/admin/chat/page.tsx`; `app/agency/dashboard/page.tsx`; `app/agency/chat/page.tsx` |
| AUD-031 | Static identities | Scholar Finder initializes forms and AI runs with a named sample student (“Tanvir Ahmed”, BUET, GPA 3.82) for every user instead of hydrating the signed-in profile or presenting blank/example-labelled fields. | `ScholarFinderPage.tsx:185-193,279-290` |
| AUD-032 | Dead/broken links | Landing footer About, Blog, Contact, Privacy, and Terms all point to `#`. | `LandingPage.tsx:364-374` |
| AUD-033 | Documentation | `apps/web/README.md` is still the generic create-next-app README and does not document the actual Neon/Auth/S3/AI/payment setup. `docs/KANBAN.md` also contains historical “implemented” claims that conflict with current behavior (for example real-time/certified chat and completed escrow). | `apps/web/README.md`; `docs/KANBAN.md` |
| AUD-034 | Global browser patch | Root layout monkey-patches `Element.prototype.setAttribute`, installs global error suppression for extension-originated errors, and runs a document-wide mutation observer. This can mask real integration issues and alter third-party/component behavior globally. | `app/layout.tsx:36-95` |

## Quality-gate failures and coverage gaps

| ID | Check | Result |
|---|---|---|
| AUD-035 | ESLint | Fails: two `no-explicit-any` errors and one `react-hooks/set-state-in-effect` error in `ChatPage.tsx`; three warnings remain (unused demo constants and an unstable hook dependency). |
| AUD-036 | Web tests | Clean rerun passes 193 tests, but 5 tests in 3 database-dependent suites are skipped locally. The first concurrent run also hit a 5-second timeout in the access-denial suite; the targeted suite passed 56/56 with a 15-second timeout. |
| AUD-037 | Python tests | Not runnable in the current workspace because neither `python` nor a usable `py` Python installation exists. AI-service behavior is therefore not locally re-verified in this audit. |
| AUD-038 | End-to-end scope | Existing Playwright files cover public smoke, auth denial, community persistence, and documents. There is no browser coverage for the broken directory-detail/compare source split, counselor DB route, Scholar pipeline persistence, guardian UI, application-to-chat creation, chat attachments/delivery/export, or live payment behavior. |

## Recommended repair order

1. Unify agency directory/detail/compare on PostgreSQL and return 404 for unknown IDs.
2. Finish the counselor schema migration, update `schema.prisma`, connect the UI to the Neon route, and correct constraint handling/grounding labels.
3. Replace Scholar and Counselor business `localStorage` with account-scoped APIs/models.
4. Restore guardian relationship hydration and parent-scoped document listing.
5. Fix application-to-chat creation, real document attachments, failed-send state, transcript export, routing parameters, read state, and pagination/realtime transport.
6. Implement a real payment provider before presenting escrow as operational in production.
7. Add origin checks to all authenticated mutations and add regression tests for the cross-feature flows above.
