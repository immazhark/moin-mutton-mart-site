# Implementation status

25 November 2026 — B + C direction approved by user.

Completed in implementation branch:
- Original logo retained; original static demo archived outside deployed assets.
- Astro/React/TypeScript scaffold, pinned dependencies, lockfile and build scripts.
- Charcoal/gold header, clean white catalogue, maroon category controls, green add/review/WhatsApp actions.
- All 13 range entries, weight/count/set steppers, item removal and empty state.
- Native modal review with optional item preferences, order note, fulfilment preference, copy/call alternatives and encoded WhatsApp compose link.
- Bounded 24-hour selection persistence; no notes, contact details, addresses or prices saved.
- Integer-paise estimate helper, unknown-price handling, unit/increment/bounds checks; no prices enabled in UI.
- Preview noindex, privacy notice, honest unavailable owner-management page.

Verification: 11 unit tests pass; Astro check and static build pass. Browser journeys written for 320/360/390/430/1280px but NOT verified: system Chromium target is missing; replacement browser download fails with HTTP 403. Astro dev/preview process exits unexpectedly in this runtime; built files can be served using Python. No claim of completed visual/accessibility/performance acceptance.

Next: run mobile/browser tests in a working browser environment; complete strict catalogue schema; Firebase emulator rules, transactional audited saves and secure owner editor. Global price-display mode must be included in the validated/audited backend contract; it is not implemented by hiding price fields in the UI alone.

Pending owner inputs: approved real photos, actual rates, exact selling/charging units and quantity bounds, chicken weight basis, hours, delivery terms, exact map pin, owner admin identity and preferred language.

No Firebase service provisioned, no live database writes, no deployment, no DNS changes, no billing enabled. Product images are explicitly marked placeholders; all rates and availability need shop confirmation. Current quantity steps are proposed enquiry preferences, requiring owner approval before launch.

## 25 November 2026 — premium redesign, slice 1 (branch feat/premium-counter-redesign)

Implemented and unit-tested: compact brand/location header; "Choose your cuts" with search and category chips; 2-column product grid with illustrative "Photo to come" tiles; immediate steppers; single bottom basket bar; review sheet (Back/Escape/focus/scroll-lock) with per-line cut input, pickup/delivery/not-sure, collapsed note, copy and call fallbacks; Lucide SVG icons; new WhatsApp message contract with sanitised customer text and a link-length guard; basket retention is now a fixed 24 h from the first item (no sliding expiry). 18 unit tests, astro check and build pass. Visually inspected at 390 x 844 in an emulated desktop browser only (first product row is inside the first viewport).

Not done / fixture-only: owner editor, Firebase rules/audit/conflict handling, quantity-option and manual-stock model, real photos, approved cut chips (none supplied, so `cuts` is empty), Manrope font (system sans for now), official WhatsApp brand asset (Lucide message icon used), PWA manifest, SEO facts. Playwright e2e spec rewritten but not run (its config uses port 4321, which was occupied locally). 320/360/430, 200% text, screen reader and physical devices unverified.

## 27 November 2026 — development continuation

Git operations explicitly authorised; production launch, DNS, live database and paid services remain separately gated. Development branch feat/secure-catalogue-continuation based on 5825719. Unicode/Hinglish, charging-unit guard, clipboard revision handling, modal navigation/focus, draft expiry, privacy wording and fresh-build Playwright configuration implemented. Normalized catalogue contract covers fixed product IDs, explicit price visibility, missing rates and manually maintained stock. No reservations or automatic stock decrement.

Prior local verification: 36 domain cases passed in a Node assertion harness after strict TypeScript compilation; this was not a Vitest run. Browser, Astro and Firebase emulator verification remain pending. Direct Git/npm DNS unavailable; GitHub API publication is available. Do not merge failing or unverified essential changes.

Infrastructure provisioned according to user handover: Cloudflare Pages and Firebase Spark Google Auth/Firestore Standard Mumbai, deny-all until independently verified. Customer and owner UI English; WhatsApp Roman-script Hinglish. Private owner identity supplied; do not publish it or ask again. Price visibility is presentation, not confidentiality under single public document design. Stock ceiling provisional. No production writes.

Next: actual Firebase Timestamp adapter, default-deny Rules, atomic audit/conflict/idempotency tests for all 13 offers; owner editor, live catalogue freshness, approved content, SEO/PWA, accessibility and mobile verification.

## 28 November — current phase

See docs/HANDOFF.md and docs/qa/DESIGN-IMPLEMENTATION.md for current status and exact evidence. The earlier entries are historical; do not treat their pending lists as the current branch state.

## 28 November — current verified checkpoint

#7–12 integrated at 70b185d. Phase 7 PR #13 implementation 78102b5 passed all six workflows, 127 test executions and strict static budgets. Final documentation-only head must pass relevant checks before merge. See HANDOFF.md for exact evidence. No production promotion. Phase 8 premium visual transformation remains next.
