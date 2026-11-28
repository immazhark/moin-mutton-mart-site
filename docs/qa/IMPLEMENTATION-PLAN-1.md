# Moin Mutton Mart — Step 2: Ranked phased implementation plan

28 November 2026 | PROPOSED — awaiting explicit approval to implement

## Scope and evidence

Basis: `docs/qa/AUDIT-0.md`, both uploaded directives, and the remote branch inventory refreshed during Step 2. The user explicitly deferred fresh Lighthouse, axe and runtime measurements. They remain UNVERIFIED and required before release, not prerequisites to starting source-based remediation. No score or runtime budget is presumed to pass. The binding F3 customer JS budget is 60 KB gzip; D2 first-view weight 500 KB, LCP <=1.8 s, INP <=100 ms, CLS <=0.02, TBT <=150 ms, cached TTFB <=400 ms, LCP image <=90 KB, total fonts <=60 KB, CSS critical inline <=14 KB and total <=60 KB. Keep the directive's Lighthouse target of 100/100/100/100, measure and report any unmet target rather than silently lower it. Mobile-first, 44x44 CSS px targets with 8px separation, WCAG 2.2 AA. No new paid services or heavy animation dependencies.

Remote snapshot: main 6bbcdf63a55c47d26d8450cb5c63fae7f3f4bffb (docs only); Pages production feat/modern-market-storefront cad4cc3ce9579b4bf0e1fa3a1a7c9314ef0d969c; integrated development feat/premium-counter-redesign f57164d7d7a12d5b9734cf33a02fd9d7d1f06a43; draft PR #6 feat/live-catalogue-freshness 4c113f1cddf2dac4154eb707b861bd02197e2c37. Main must be pulled first on every implementation session; check working tree, fetch all refs, inspect Claude's handoff and new commits. Local pull was blocked during audit, so if still unavailable, do not misstate it as completed. Proposed alternative for approval: read fresh main, branch trees and PRs through authenticated GitHub API, verify exact base/head and file hashes, use a fresh isolated branch and non-force ref updates; CI does the checkout/build. If this alternative is not approved, wait for a compliant checkout. Never work directly on main or the Pages production branch. Until a separate integration decision, use the existing premium development branch as the PR base. Do not alter the production branch configuration.

## Ranked PR sequence

Each phase is one small reviewable branch/PR, run tests, capture evidence and append docs/HANDOFF.md. Stop after each phase for review as directed. Branch names below are proposed, not created. Re-evaluate scope if Claude has changed overlapping files; split work further by agreement if a PR becomes too broad. Findings numbers refer to AUDIT-0 section 8.

| Phase | Proposed branch | Audit findings | Priority / effort |
|---|---|---|---|
| 1 | fix/chatgpt-reconcile-storefront | 1,2,4,9 | P0 / M |
| 2 | fix/chatgpt-security | 3,5,17 | P0 / M |
| 3 | fix/chatgpt-accessibility | 10,14,15 | P0 / M |
| 4 | perf/chatgpt-mobile-budget | 6,7,8,15 | P0 / M-L |
| 5 | feat/chatgpt-local-discovery | 11,12,13,14 | P0 / M |
| 6 | fix/chatgpt-privacy-owner | 16,18 | P1 / M |
| 7 | chore/chatgpt-quality-gates | 17,20 | P1 / M |
| 8 | design/chatgpt-counter-polish | 13,19,20 | P1 / M |
| 9 | qa/chatgpt-release-evidence | all remaining | Release gate / M-L |

### Phase 1 — recover the integrated baseline (precondition to security)
- Start from current integrated development, preserve its working admin route and merge only reviewed changes from PR #6. Diff all touched paths against both parents; avoid replacing files by blindly copying a tree. Restore route mounting of OwnerConsole and owner.css; don't delete components mistaken for dead code. Preserve Unicode, link length, estimates, freshness, copy/expiry, history and existing Firestore behavior.
- Test actual configured customer path on an isolated demo/emulator: item, quantity, cut note, pickup/delivery, exact decoded URL, changed rates, availability, known blocked items, network failure and link expiry. Verify prior owner regression, no Firebase calls from unconfigured route, no writes to production; no automatic order submission or stock deduction. Do not allow a transient refresh to bypass known blocked items; make fallback explicitly unpriced and clearly qualified.
- New branch/PR replaces the work in #6, not the original branch; keep #6 draft until replacement verified and integrated, then close with cross-reference (no deletion). Install binding rulebook in AGENTS.md and CLAUDE.md without discarding existing project-specific safeguards, record handoff and reconcile stale status docs. Main promotion separate; no production changes.
- Gate: type check/build, all existing 60 unit, 11 browser, 10 Rules and 7 SDK cases (or documented justified updates plus new regressions), no unrelated file changes, successful relevant CI at exact head. Historical tests are not a current pass.

### Phase 2 — security and safe owner access
- Review `firebase/firestore.rules`, SDK and browser config, transaction/revocation, safe auth session and recovery; preserve passing emulator invariants. Test synthetic active/revoked/missing membership, denied list/writes, concurrent revisions, duplicate operations, atomic audit and all 13 offers. No public identities; hiding public document rates is display only, not secrecy.
- Add appropriate Cloudflare Pages header definitions (including CSP report-only first, strict script controls, frame protection, nosniff/referrer/permissions and cache policy); test Google popup compatibility before enforcing COOP/CSP. HSTS on approved domain only when HTTPS/subdomain readiness established; no preload submission without review. Verify staged headers and CSP report evidence before enforcement; do not claim a secure live deployment without actual headers. Document threat model, quota/abuse risks, backups, incident response and MFA recommendation. No invasive production scans.
- Current audit, secret scanner and compatible targeted dependency remediation; preserve locked dependency graph. Historical root audit zero, isolated emulator 14 moderate findings; triage each, avoid forced upgrades/downgrades. Document and gate residual exposure. Upgrade pinned CI actions if compatible. No admin credentials in client. Production auth/bootstrap deferred.
- Gate: emulator adversarial tests, root and tooling audit outputs, secret scan, header tests on isolated preview; any blocked runtime evidence remains UNVERIFIED, not green. Don't enable live rules or real accounts.

### Phase 3 — accessibility and language foundation
- Existing CSS/Stepper/ReviewSheet/OwnerConsole: enforce 44x44 actual hit targets and 8px spacing, prevent flex shrink, improve necessary input boundaries to >=3:1 and text >=4.5:1, fix sticky-bar focus obstruction, native dialog keyboard and focus restore, visible validation/announcements, 200% text/reflow, reduced motion, forced colors; accessible statement/contact. Keep existing palette.
- Native no-JS call and direct WhatsApp enquiry fallback; no claim that the full basket runs with JS disabled. Preserve English UI and Roman Hinglish messages; ensure Urdu/Telugu/Devanagari notes round-trip without loss. Add translation structure without fictitious translations; full localization gated on approved language scope and native-speaker review. RTL/Indic testing when available.
- Gate: automated keyboard/viewport and no-JS tests, contrast calculations, axe/pa11y and real screen readers deferred if unavailable. Do not claim WCAG conformance before evidence.

### Phase 4 — low-end Android performance
- Keep existing logo original; add small responsive optimized variants for actual display sizes, explicit dimensions; no invented photos. Static-first Astro HTML; profile React hydration and configured Firebase entry imports separately. Use minimal public read transport only if measured budget requires it and contract/rules/freshness semantics remain intact; keep owner SDK on admin route. No heavy motion or framework migration. No unnecessary preconnect, polling, offline authoritative price cache or analytics.
- Keep native system fallback until font choice and subset can earn bytes; at most two above-fold files, 60 KB total. Prefer SVG icons and native CSS; evaluate any dependency by size, license, maintenance and audit. Minimize first-view CSS and long tasks. Add reproducible bundle/transfer budgets and Lighthouse CI in test environment; distinguish actual transfer from local gzip estimate, production configured from disconnected preview, field INP from lab TBT.
- Gate: customer <=60 KB first-load JS gzip, <=500 KB first view, logo variant measured; other D2 thresholds above. If measurements are unavailable, land only verified isolated changes with explicit deferred runtime gate if approved; no claim of meeting performance budget. Stop before release.

### Phase 5 — SEO/AEO/GEO, factual local content and hours
- Typed shop facts, structured Store/LocalBusiness graph, canonical URLs, crawlable static content, OG cards, robots/sitemap and noindex isolation for preview/admin. Only emit confirmed attributes. Factual concise FAQ/cut guide, phone, map link (avoid expensive embedded map by default; if required, click-to-load as a proposed exception), WhatsApp Business alignment, GBP categories/services/hours, special holiday hours and real review link once verified. `llms.txt` optional low-cost experiment, no ranking promises. Do not equate acceptingRequests with business opening hours. Use Asia/Kolkata with holiday exceptions; unknown hours show call to confirm. Do not remove live noindex until launch approved. Search Console/Bing submission later.
- [NEEDS CLIENT INPUT]: GBP link/address/pin, hours/exceptions, rates/charging bases/approved cut options and delivery terms, languages and real photos/claims. Facts may be collected without interrupting engineering; do not publish guesses. Maintain owner ability to edit daily rates/availability. Gate: schema validation, robots/canonical checks, fixtures for hours boundaries, NAP review and production indexing approval later.

### Phase 6 — privacy and practical owner workflow
- Data map and privacy policy for customer browser draft, WhatsApp handoff, Firebase owner auth/audit retention, rights/contact and complaint channels. No collection of customer address unless needed; preserve explicit compose-not-send. No trackers or paid services by default. Review policy language with owner/legal advisor before publication.
- Improve safe uncertain-save recovery across interruption (same operation ID, no blind retry or offline write; assess privacy before persistence), clearly distinguish no-op/conflict/committed states. Simple daily edit flow for rates, availability, manual stock, shop pause; private backup/restore drill. Owner-editable confirmed hours/content only within agreed scope; if extending schema, separate review and emulator regressions, preserve existing audit and deny defaults. Owner phone acceptance and actual Google login remain gated.
- Gate: synthetic interrupted-save and restore tests, revocation, conflict and backup validation, no private data leakage, documented owner workflow and retention decisions.

### Phase 7 — cleanliness and repeatable QA
- Reconcile docs/decisions/runbook, current AGENTS/CLAUDE and handoff. Audit unused files/exports/deps with knip; never delete content, reference demo or migrations without approval; fix legitimate non-null assertions and lint/type hints. Add narrowly scoped lint/style/HTML/security/secret and CI quality checks where needed, pinned tools, lockfiles, least privileges; avoid new production dependencies. Add 404/offline/manifest only if useful, not offline live pricing. Document security and regression evidence and cross-browser/visual testing scripts.
- Gate: check/lint/test/build, dependency/secret reports, exact SHA logs; no irrelevant cleanup or new framework.

### Phase 8 — premium visual refinement (wow pass, after risk fixes)
- Preserve B+C palette and logo. Strengthen first-view shop name, verified hours/availability, primary order action; approved real photo hero only when supplied, responsive <=90 KB LCP asset. Use typography with intent but measure bytes; cleaner product cards and cut guide, distinct hierarchy, short factual copy. Three lightweight micro-delights: tactile stepper, clear ready-to-send confirmation, subtle cuts-guide reveal (native CSS only and reduced-motion alternative). No generic cards-for-everything, fake product photos, gradient blobs or heavy motion. Build living component reference only where current system gaps warrant; prevent public indexing of QA route. QR linked to approved canonical site only, no live launch before consent.
- Gate: B3 score with actual visual evidence, 10 weakest details improved, all >=9/10 before release; visual screenshots at 360/768/1280/1920 plus 320/390/430 target checks. If approved imagery/claims missing, continue layout with honest placeholders in preview only; never publish invented assets or trust claims.

### Phase 9 — evidence and launch readiness (not launch)
- Collect deferred Lighthouse mobile/desktop, configured cold-load JS and transfer, axe/pa11y, keyboard/screen-reader, real low-end Android/4G and WhatsApp compose, iPhone/tablet/desktop, cross-browser Playwright (Chrome/WebKit/Firefox), visual snapshots, no-JS/reduced-motion/forced-colors, curl headers/CSP validation, approved staging ZAP, security scanners, schema, GBP/NAP and all Part E artifacts. Record exact commands, outputs, commits, test environment and remaining issues; lab/field measures separate. If field data not available, mark UNVERIFIED and establish measurement plan; do not invent it. No claimed production readiness with missing required evidence.
- Produce final owner guide, operational rollback and release checklist. Any production DNS, data, rules, branch promotion, indexing, public launch, paid service, or real owner account action remains separately authorised; no live operation in this plan.

## Execution protocol

After explicit approval, start Phase 1 only. At every phase: read directive/handoff, pull main and fetch refs (or approved API equivalent), choose unique branch, test-first for behavior changes, small conventional commits, compare diff/base and preserved files, run CI, capture actual outputs, append handoff, stop at phase boundary. Never force push, directly commit main, merge red CI, overwrite Claude's work, delete data/content or promote production. Routine approved development merges may occur only when relevant tests pass; no merge of a PR with a failing essential test. Independent tasks within the approved phase can proceed while CI runs, but no next phase without review. If mandatory fresh measurements remain deferred, explicitly distinguish verified engineering from pending release acceptance. A plan approval does not waive Part E.

## Client inputs (not blockers for phase 1)
1. Exact GBP/Maps profile, verified address/pin, regular and holiday hours.
2. Actual price list and selling/charging basis, quantity bounds, set contents and approved cut types including chicken weight basis.
3. Delivery area/fees/conditions and WhatsApp Business catalogue alignment.
4. Customer language scope (English UI and Roman Hinglish already established; confirm additions).
5. Real shop/cut photos and substantiated trust/food-safety claims, if desired.

No repeat request for previously supplied owner identity. No invented price, halal, licence/FSSAI, review or photograph. No human inputs required to begin Phase 1. Save external setup/approval for when it is actually needed.

**What changed:** plan and local handoff only. **How to verify:** compare audit and refreshed remote refs, review each gate and branch strategy. **Still open:** plan approval, deferred runtime evidence, PR #6, client facts and release authorizations. STOP before Phase 1 implementation.
