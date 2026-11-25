# Moin Mutton Mart Implementation Plan

> For agentic workers: use superpowers:executing-plans to implement task by task. Native execution is the default recommendation; no parallel editing of shared files.

**Goal:** Build a distinctive mobile-first shop and simple owner price editor using free tiers only.

**Architecture:** Astro pre-renders business content; React islands handle catalogue and admin. Firebase Spark Google Auth and Firestore secure live offer data. Cloudflare Pages serves the site and images; WhatsApp receives user-sent requests.

**Tech stack:** Astro, TypeScript, React, custom CSS, Firebase modular Web SDK, Firestore Rules/Emulator, Vitest, Playwright, Cloudflare Pages.

**Spec:** ARCHITECTURE.md, consolidated Firebase revision, 25 November 2026. When committed, place both documents under docs/ and maintain canonical links.

## Global constraints

- Free tiers only; no linked billing, paid subscriptions or paid trial dependencies.
- Preserve existing logo. No invented rates, hours, delivery promises, ratings or certification.
- Support 320/360/390/430px phone widths and desktop; primary touch controls at least 44px.
- Currency integer paise, weight integer grams, count/set integer quantities. Unknown rate is null, never zero.
- Customer accounts, online payments, stock reservation and automated WhatsApp sending are excluded.
- No production data writes from preview builds; no private identities or credentials in public git.
- Real photos require approved derivatives; placeholders clearly identified in development.
- Three visual concepts and user selection precede product UI implementation. Architecture planning is approved; visual selection remains pending.

## Review focus

1. Timeout after successful save: reread operation record; never duplicate a save.
2. Signed-in non-admin or revoked admin: database rules must deny writes independently of UI.
3. Mixed unknown prices/live versus cleaned weight: never show misleading complete estimates.
4. Phone browser returning from Google/WhatsApp: preserve flow without claiming order acceptance.
5. Offline/quota errors: clear fallback; no stale rate or optimistic saved claim.

## File boundaries and contracts

- src/data/products.ts: fixed product metadata and quantity/unit configuration; export products: Product[].
- src/lib/catalogue/types.ts: Product, Offer, Catalogue, Selection, Estimate and SaveResult.
- src/lib/catalogue/schema.ts: parseCatalogue(input: unknown): Catalogue; validate all fields/bounds.
- src/lib/catalogue/client.ts: readCatalogue(): Promise<Catalogue>; always server freshness or explicit failure.
- src/lib/catalogue/save.ts: saveCatalogue(baseRevision: number, draft: Catalogue, operationId: string): Promise<SaveResult>.
- src/lib/order/estimate.ts: estimateOrder(products: Product[], catalogue: Catalogue, selections: Selection[]): Estimate.
- src/lib/order/message.ts: formatRequest(...): string; buildWhatsAppUrl(message: string): string.
- src/lib/order/storage.ts: versioned non-personal draft selection persistence.
- src/components/catalogue/: CatalogueApp, ProductCard, QuantitySheet, ReviewSheet.
- src/components/admin/: AdminApp, PriceRow, SaveBar, SessionGate.
- src/pages/: index.astro, admin/index.astro, delivery.astro, visit.astro, privacy.astro.
- src/styles/: tokens.css, global.css; component styles colocated where practical.
- firebase/firestore.rules: strict fixed-product validation, membership, audit and publication protocol.
- firebase/tests/: emulator policy and transaction tests; firebase.json configures emulator/rules paths.
- public/: approved images, manifest and icons; no original source media or private exports.

Catalogue: schemaVersion, revision, updatedAt, operationId, acceptingRequests, offers keyed by fixed product IDs. Offer: enabled, pricePaise|null, availability, priceUpdatedAt, availabilityUpdatedAt. Product supplies immutable pricing basis and allowed quantities.

Selection: productId, quantity integer in product's unit, bounded preparation preference. Estimate: {kind:'complete', totalPaise:number} or {kind:'confirmation_required', reason:string}. SaveResult: {kind:'saved',revision:number} or {kind:'conflict',current:Catalogue}; network/permission errors remain typed failures and do not imply commit failure.

## Task 1 — Repository foundation and selected visual target

Files: README.md, AGENTS.md, CLAUDE.md, docs/PROJECT_BRIEF.md, docs/DESIGN_DIRECTION.md, docs/OWNER_INPUTS.md, docs/RESEARCH.md, docs/IMPLEMENTATION_STATUS.md, docs/architecture.md, docs/superpowers/plans/2026-11-25-moin-site.md, .gitignore, reference/demo/, public/images/logo.png.

- [ ] Recheck repository branches/contents before any import; preserve existing work. Recover original attachment bytes if needed. Archive the demo without enabling deployment of it.
- [ ] Prepare public-safe shared docs and initial commit; exclude raw commercial handover. Verify logo is included and reference paths resolve.
- [ ] Produce three labelled visual concepts showing mobile catalogue, review sheet and owner editor. Use placeholder rates explicitly labelled illustrative; do not imply real stock photographs.
- [ ] Present concepts and record the selected direction before writing product UI.
- [ ] Commit foundation separately from later application changes; do not change repository visibility or deploy merely because files were imported.

## Task 2 — Application shell and domain logic

Files: package.json, lockfile, astro.config.mjs, tsconfig.json, src/pages/, src/styles/, src/data/products.ts, src/lib/catalogue/{types,schema}.ts, src/lib/order/estimate.ts, tests/estimate.test.ts.

- [ ] Scaffold Astro/React/TypeScript with pinned dependencies and scripts: dev, build, check, test, test:rules, test:e2e. Use npm consistently.
- [ ] Write tests: 90000 paise/kg * 500g => 45000 paise; two sets at 10000 paise/set => 20000; null price => confirmation_required; illegal increments and missing products rejected; line rounding half-up; sums safe within configured bounds.
- [ ] Run npm test -- tests/estimate.test.ts and observe expected failure before implementation.
- [ ] Implement estimateOrder and parseCatalogue with product-specific validation. Unknown chicken charging basis stays enquiry-only.
- [ ] Run targeted tests, npm run check and npm run build; commit passing domain foundation.

## Task 3 — Fixture-backed customer shopping experience

Files: src/components/catalogue/, src/lib/order/{storage,message}.ts, tests/order-message.test.ts, tests/e2e/catalogue.spec.ts.

- [ ] Write message/draft tests: encoding punctuation/Unicode; no zero-price invention; corrupted/expired drafts rejected; no address/contact persistence.
- [ ] Write journey test: category => ADD => valid quantity => review => edit/remove => empty state. Assert keyboard focus returns after sheets close.
- [ ] Build selected visual direction using fixtures, categories, product cards and review bar. No giant mobile hero hiding catalogue.
- [ ] Implement formatRequest and WhatsApp URL creation for primary business number. Final tap opens compose only; returning keeps selection. Add copy/call alternatives.
- [ ] Verify mobile widths, keyboard navigation, large text, reduced motion and bottom safe area. Run targeted tests/build; commit.

## Task 4 — Firebase Rules and atomic owner publication

Files: firebase.json, firebase/firestore.rules, firebase/tests/catalogue.rules.test.ts, src/lib/firebase.ts, src/lib/catalogue/{client,save}.ts, .env.example, docs/FIREBASE_SETUP.md.

- [ ] Use local emulator initially; configure no paid product. Document Firebase Spark/no Cloud Billing and Google Auth authorised domains. Seed a bounded catalogue and admin fixtures locally.
- [ ] Write emulator tests for public direct read, denied listing/private reads, denied anonymous/non-admin/revoked-admin writes, denied role escalation, audit mutation, unknown keys, invalid rates/availability and timestamp spoofing.
- [ ] Write atomic tests: catalogue update without matching audit fails; valid catalogue+audit succeeds; stale revision fails; repeated operation ID returns existing result; audit snapshot mismatch fails. Check Rules expression/access limits with all 13 products changed.
- [ ] Run emulator test script and observe failures against deny-all baseline; implement precise Rules using getAfter and field checks. Enforce revision increment and matching server timestamp/actor in audit. Never rely on UI restrictions.
- [ ] Implement readCatalogue server fetch and saveCatalogue online transaction. Compare expected revision before mutation; resolve unknown network outcome by operation ID. Avoid offline queued writes.
- [ ] Run npm run test:rules, relevant unit tests and build; document actual tested access counts and commit. If the single-document Rules protocol cannot be proven secure, stop this task and simplify schema/protocol before UI integration; do not weaken Rules.

## Task 5 — Owner mobile editor

Files: src/components/admin/, src/pages/admin/index.astro, tests/e2e/admin.spec.ts, docs/OWNER_GUIDE.md.

- [ ] Write journeys for unauthorised login, allowed login, numeric rate edit, availability change, successful save, conflict and session expiry.
- [ ] Implement mobile session gate using Firebase Google sign-in. Verify popup and documented redirect recovery on actual phone browser; membership remains authoritative in Rules.
- [ ] Build price list with immutable units, simple availability control, sticky save bar and changed-item count. Keep ask-rate options in details; no dense generic admin dashboard.
- [ ] Verify save timeout after commit rereads operation result; failed save retains memory draft; stale revision shows changes for review rather than overwriting. Navigation warns about unsaved edits.
- [ ] Add manual private JSON export and schema-validated restore through the same audited save mechanism, restricted to admin. Never download private exports into public assets.
- [ ] Run rules and admin journey tests; commit. Conduct Moin phone trial when access is available; record observations.

## Task 6 — Freshness, failures and quota budget

Files: src/lib/catalogue/client.ts, src/components/catalogue/CatalogueApp.tsx, tests/e2e/freshness.spec.ts, docs/OPERATIONS.md.

- [ ] Write tests for changed price before handoff, sold-out selection, unknown price, fetch failure, acceptingRequests=false and stale tab resume.
- [ ] Fetch once on entry, deduplicate reads, refresh on visibility return only after 60 seconds, and always recheck before handoff. No repeated background polling/listeners.
- [ ] Show and require review of changed selections before compose. On fetch failure offer an explicitly unpriced enquiry; never reuse old rates as current.
- [ ] Measure document size and reads per journey, including Rules/admin lookup reads. Record a sample quota budget, not an unlimited traffic promise. Evaluate no-cost App Check compatibility/limits before enforcement; test legitimate mobile access and preserve fallback.
- [ ] Run freshness journeys with forced errors; verify no automatic upgrade path or billing integration; commit.

## Task 7 — Real content, search and home-screen experience

Files: public/images/, public/manifest.webmanifest, src/pages/, src/components/brand/, docs/CONTENT_CHECKLIST.md.

- [ ] Map and optimise approved photographs; preserve truthful appearance and portion presentation. Verify image dimensions, responsive sources and alt text.
- [ ] Add confirmed address, hours, delivery terms and owner-approved copy. Unconfirmed fields remain omitted or enquiry-based; no fake review/halal certification.
- [ ] Add canonical metadata, sitemap, robots, accurate LocalBusiness data, preview/admin noindex and useful privacy notice. No baked-in volatile price offers.
- [ ] Add manifest/icons and home-screen guidance where supported. Avoid service worker initially unless needed; any later worker caches only public versioned assets and bypasses admin/auth/catalogue.
- [ ] Run content/link checks, accessibility review and throttled mobile performance checks. Verify mobile layout without overlaps at all target widths; commit.

## Task 8 — Preview and launch handover

Files: Cloudflare deployment config, docs/OPERATIONS.md, docs/IMPLEMENTATION_STATUS.md.

- [ ] Connect authorised GitHub/Cloudflare accounts and provision only Firebase Spark when account access is available. Configure authorised administrators privately. Inspect current DNS before changes.
- [ ] Deploy preview without production admin access; verify selected design, catalogue, fallback and owner flow using isolated test configuration.
- [ ] Complete production Rules tests and Google sign-in setup; validate published prices and product units with owner. Never launch sample rates.
- [ ] Connect apex domain through Cloudflare zone/nameservers while retaining Spaceship registration and preserving DNS/mail records. Verify HTTPS, www redirect and canonical URLs.
- [ ] Run production smoke checks read-only where possible; use an explicitly planned owner update for the real save check. Confirm WhatsApp destination without sending a message on the user's behalf.
- [ ] Record rollback (previous static deployment plus compatible Rules/data), private export recovery, quota review and account-revocation steps. No automatic paid upgrades.

## Dependencies and execution

Task 1 visual selection precedes Task 3 UI. Task 2 precedes Tasks 3/4. Task 4 precedes Task 5 and live integration in Task 6. Task 7 can progress on confirmed content independently; Task 8 requires owner inputs and account access. Continue unblocked work while checks run; essential failures block integration, not unrelated work.

No implementation is claimed by this document. Next deliverable: three visual concepts and a public-safe repository foundation. Native execution is recommended for this compact connected project, with focused independent review at security/integration milestones if authorised.
