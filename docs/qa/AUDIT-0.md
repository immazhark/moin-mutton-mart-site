# Moin Mutton Mart — AUDIT-0

**28 November 2026 | Step 1 / read-only baseline | NOT RELEASE-READY**

Scope: binding `DIRECTIVE-moin-mutton-mart.md` (Parts 0, C, D, E, F3 and H1), supplementary master directive, GitHub repository `immazhark/moin-mutton-mart-site`, Cloudflare Pages metadata, existing CI logs and static source review. No application or repository changes, commits, PRs, deploys, DNS, Firebase writes or paid services. The only authored files are this downloadable audit and a handoff note, outside the repository. Step 2's ranked phased PR plan is deliberately deferred to the next user-authorised step, as explicitly instructed; the ranked findings below are an audit, not implementation authorisation.

## 1. Baselines and multi-agent safeguards

| Reference | Exact commit | Meaning |
|---|---|---|
| `main` | `6bbcdf63a55c47d26d8450cb5c63fae7f3f4bffb` | Default branch; seven documentation/config files; no executable application or package.json |
| `feat/modern-market-storefront` | `cad4cc3ce9579b4bf0e1fa3a1a7c9314ef0d969c` | Pages production branch; older storefront |
| `feat/premium-counter-redesign` | `f57164d7d7a12d5b9734cf33a02fd9d7d1f06a43` | Integrated development baseline, PRs 1–5 merged |
| `feat/live-catalogue-freshness` | `4c113f1cddf2dac4154eb707b861bd02197e2c37` | Open draft PR #6; newest customer integration; red development CI |

Cloudflare read-only API returned `production_branch = feat/modern-market-storefront`, `domains = [moin-mutton-mart-site.pages.dev]`, canonical deployment commit `cad4cc3...`, status `success`, URL `https://09954dd3.moin-mutton-mart-site.pages.dev`. Latest preview `https://549dc110.moin-mutton-mart-site.pages.dev`, commit `4c113f1...`, status `success`. A successful deployment build is not a functional acceptance test. Custom apex is not attached to this Pages project. Actual HTTP response and DNS outside this environment remain UNVERIFIED.

`git pull --ff-only` on main could not be performed: no checkout and DNS failure. Instead, the authenticated read-only GitHub API fetched current main and all branch trees, PRs, commit references, relevant sources and CI logs. This is remote inspection, not a substitute for a local pull or clean working tree check. No branch was created; proposed isolated **local audit branch** `audit/chatgpt-audit-0-20261128` (not created). Repository `AGENTS.md`/`CLAUDE.md` still contain the earlier short rules; the uploaded full directive has not been installed in the repo. No `docs/HANDOFF.md` exists in the inspected trees. Main has two commits, latest `docs: establish free-tier architecture and shared delivery foundation`. Do not merge into main or promote production until branch strategy and the new directive are reconciled. No automatic merge of PR #6.

## 2. Executive assessment

**Critical regression, confirmed:** PR #6 has the old 675-byte `src/pages/admin/index.astro` (blob `80b79412...`), identical to production's placeholder, whereas merged development has the 800-byte route (blob `9ad43410...`) mounting `OwnerConsole client:load`. The component still exists on PR #6 but is orphaned from the route. Latest Playwright correctly fails because the expected unconfigured-owner heading is missing. This is a genuine branch reconciliation defect, not a test-selector defect. Preserve the working owner route and do not merge the PR in this state.

**Great / keep:** static Astro deployment; small fixed catalogue; no heavy animation dependencies; native dialog/controls, semantic labels, call and copy fallback; strict integer-paise arithmetic, input bounds and no fabricated rates; Firebase rules that enforce active membership and atomic immutable audit, emulator-covered; session-scoped authentication, bounded local storage and explicit no-reservation model. Keep the existing B+C charcoal/gold, maroon and green brand tokens rather than re-stack or redesign wholesale.

**Good:** integrated owner editing, manual stock, price visibility, private draft backup and audited restore exist in development. Customer freshness/review/expiry logic exists in PR #6 and its ten customer browser journeys passed. Neither proves production operation, physical phone usability, or the complete configured UI. Prior development verifies the disconnected owner screen, not real Google login.

**Bad:** the customer preview is functional but visually generic: repeated placeholder cards, system fonts only, no real-photo hero, no cut guide, no opening status or directions; narrow screens require scroll and potentially tight stepper controls. No meaningful performance or accessibility evidence gate exists. Earlier implementation status docs are stale. **Worse:** wrong admin page in newest PR, live production on earlier implementation, no approved rates or charge units, no verified live owner access, no measured 60 KB JS budget, no production headers evidence, no useful search presence. Do not label any snapshot production-ready.

## 3. Scored audit (Part H1)

Scores are provisional **source/evidence maturity judgements**, not tool-generated scores or rendered design ratings. 1 = missing/blocking, 10 = evidenced against directive. Current visual experience, actual user timing and measured performance are UNVERIFIED. No Lighthouse or accessibility score has been invented.

| B3 category | Weight | Provisional score /10 | Reason / fix-list subject |
|---|---:|---:|---|
| Design and visual craft | 30% | 5 | Consistent tokens and shop-specific palette, but system typography, repetitive placeholders, absent photo hero, incomplete designed states. Review rendered visuals before changing branding. |
| Usability and clarity | 25% | 6 | Clear basket/review/quantity/fulfilment, call fallback; owner route regression and no-JS order path missing; 15-second task benchmark UNVERIFIED. |
| Creativity and memorability | 20% | 4 | Counter concept is useful, but signature photo-led availability moment and cuts guide absent. |
| Performance and robustness | 15% | 4 | Astro and bounded data; oversized logo; hydration and configured Firebase download risk; unmeasured performance; owner regression. |
| Content and trust | 10% | 4 | Truthful preview labels, no invented claims, but prices, hours, address, real photography and business profile verification missing. |

Weighted source-review score: **4.80/10** (not a Lighthouse score; not a visual or device acceptance result). All categories below 9. Part C design maturity 5/10; D1/D7 architecture/code 6/10; D2 performance evidence 2/10; D3 accessibility evidence 4/10; D4 security 5/10 (strong emulator proof, production hardening unverified); D5 discovery/local SEO 2/10; D6 privacy 4/10; E evidence gate 2/10. These are qualitative scores, not external measurements.

## 4. Performance baseline (strict F3 overrides D2)

| Metric | Binding target | Actual evidence | Result |
|---|---:|---|---|
| Customer first-load JS gzip | ≤60 KB (not generic 90 KB) | Build logs do not report byte sizes; existing static React island and Firebase dynamic import in configured build | UNVERIFIED; high risk |
| Critical inline CSS / total CSS | ≤14 KB / ≤60 KB | `src/styles/global.css` 12,221 source bytes; `owner.css` 3,698 source bytes on development; not generated CSS or critical inline measurements | UNVERIFIED |
| Hero/LCP image | ≤90 KB | No hero photograph; header `public/images/logo.png` 268,039 bytes (261.76 KiB); displayed 40×50 on dev, 64×80 production; no responsive source | Header asset overweight; LCP identity UNVERIFIED |
| First-view weight | ≤500 KB | Logo alone 53.6% of 500,000 bytes; no complete transfer trace | UNVERIFIED |
| Fonts | ≤2 above fold; ≤60 KB | No font assets in inspected trees, no `@font-face` in current CSS; system and named local fallback stack | Source: 0 shipped font files; runtime transfer UNVERIFIED; C3 craft gap |
| LCP | ≤1.8 s | No lab or field data | UNVERIFIED |
| INP | ≤100 ms | No field interaction measurement | UNVERIFIED |
| CLS | ≤0.02 | No lab/field data | UNVERIFIED |
| TBT | ≤150 ms | No Lighthouse run | UNVERIFIED |
| Cached edge TTFB | ≤400 ms | No usable HTTP request | UNVERIFIED |
| Lighthouse P/A/BP/SEO | 100/100/100/100 | No report | UNVERIFIED |

Existing CI log shows `Catalogue.Bdhhxnzb.js`, `client.Cd-EeyjT.js`, `react.CvnImTBr.js` and CSS loaded in the unconfigured PR #6 browser run. This proves presence, not compressed weight. Configured build additionally imports Firestore (`firebase-public.ts`, `firestore.ts`) on entry: inspect actual dependency waterfall and consider minimal public-read transport before choosing a remedy. Do not count the root package-lock size as shipped JS. No motion library is installed. A logo is not the measured LCP element. No cold-load transfer, INP, throttle, network failure latency, RUM, Lighthouse CI or size-limit output exists. The system font avoids downloads; a future custom face must earn its bytes and cover approved scripts. Public no-JS fallback currently exposes call/visit info but the basket cannot be operated without hydration. Keep Astro; no framework migration or animation library justified.

## 5. WhatsApp and owner workflow evidence

| Flow | Production source (`cad4cc3`) | Development / PR #6 |
|---|---|---|
| Item selection | 13 entries and category selection | Search, categories, 13 entries; Chromium tests at 320/360/390/430/1280 |
| Quantity | Weight/piece/set increments, provisional limits | Stepper, bounds, stock checks in PR #6; all limits require approval |
| Cut type | Free-text optional | Chip support exists but no product defines `cuts`; free text only. [NEEDS CLIENT INPUT] |
| Pickup/delivery | Select with Pickup/Delivery enquiry/Discuss | Native buttons for pickup/delivery/not sure; no delivery promise; browser test covers pickup, unit cases cover all modes |
| Composed message | English, encoded wa.me; unpriced; raw notes | Structured Roman Hinglish plus English headings/items; sanitized Unicode, copy/call, link-length guard. PR #6 checks current offers, expires grant after 15 seconds, invalidates edited text, and offers explicit unpriced enquiry |
| Price estimate | All pricingBasis null; no live totals | Integer-paise helper and synthetic test fixtures, all actual bases still null. No real total possible |
| Handoff | `wa.me/918143730054` | CI decodes URL and verifies quantity/cut/pickup; no real send or actual handset WhatsApp launch tested |
| Owner price and availability | Placeholder | Dev mounts authenticated editor, but PR #6 regresses route; actual Google auth, live bootstrap, real phone update and refresh on customer device UNVERIFIED |

Example of expected development request composition from current code, **illustrative test input only**, not a real order or confirmed rate:

```
*MOIN MUTTON MART — ORDER REQUEST*

*ITEMS* (1)
1. Mutton with bone
   Quantity: 1 kg
   Cut: Medium curry pieces

*FULFILMENT*
Pickup chahiye.

*PRICE*
Rate aur total confirm kar dijiye.

Availability, final weight, total aur timing confirm kar dijiye.
```

Recipient in source: +91 81437 30054. Real ownership/WhatsApp Business catalogue, real delivery, mobile app handoff and sent/received message are UNVERIFIED; do not send test messages to customers or owner without agreement. Existing production `formatRequest` directly interpolates notes and `encodeURIComponent` can throw for an unpaired surrogate; no URL guard. These were addressed in newer development but not deployed. PR #6 freshness tests use synthetic catalogue data; the browser journeys use unconfigured fallback, so configured live UI price/stock change scenarios are UNVERIFIED. Static observation: publishing `loading` discards previous snapshot; a known unavailable product may become requestable during refresh/outage and copy may offer an unpriced enquiry before a new check. Review whether known blocked status should remain conservative while stale and test transitions. Price display remains presentational, not confidential; rates are in public document by design.

## 6. Accessibility and language

Source-defined target sizes: `.call`, `.categories button`, `.link-btn`, `.chip`, `.note summary`, footer links >=44px height; Add/stepper/basket >=48px; `.icon-btn` 48×48; primary/secondary actions >=52px height. Width, actual flex shrink, 8px separation, zoom and keyboard obscuration UNVERIFIED; narrow product grid can shrink stepper buttons below declared width since flex items may shrink. Owner labels are 44px high with a 22×22 checkbox inside; actual hit area UNVERIFIED. Sticky review header and fixed bars require focus-not-obscured checks. Native dialog, accessible names, skip link and visible focus exist. No axe, pa11y, screen reader, 200% text, WebKit, Firefox, no-JS screenshot or forced-colors evidence.

Computed WCAG relative-luminance contrast from PR #6 CSS values (actual Python output, not rendered axe result):

```
#1f2421 / #ffffff: 15.76:1
#5a645e / #ffffff: 6.14:1
#5a645e / #f4f6f4: 5.65:1
#d4b56d / #202321: 8.03:1
#cfc6ad / #202321: 9.32:1
#ffffff / #176343: 7.24:1
#ffffff / #742e3e: 9.53:1
#7b5560 / #efe9ea: 5.29:1
#7a6526 / #f3eedd: 4.87:1
#2f6d51 / #eaf4ee: 5.45:1
#b8c4bb / #ffffff: 1.80:1
#dfe5e1 / #ffffff: 1.28:1
#b8c5bd / #ffffff: 1.79:1
#8a6a1c / #ffffff: 5.05:1
```

Sampled text pairs meet 4.5:1; pale input borders fail 3:1 when the border is necessary to identify the control, so audit actual states against WCAG non-text contrast. Decorative separators need not meet that requirement. This calculation is not a site-wide pass. Reduced-motion CSS exists; no forced-colors, increased-contrast, or designed dark theme evidence. `lang=en`, English UI, Roman-script Hinglish WhatsApp; multilingual notes are accepted, but no actual language switch, `dir=rtl`, localized metadata or scripted translation. Owner's previously established English UI preference can be preserved; confirm whether customer UI needs English + Urdu/Telugu/Hindi and which scripts, without treating Roman Hinglish as equivalent to a localized interface. Unicode round-trip/shaping and TalkBack tests on actual Android still UNVERIFIED. [NEEDS CLIENT INPUT] for multilingual scope.

## 7. Search, business facts and hours

Production and development home pages deliberately emit `noindex,nofollow`; appropriate for preview, a launch blocker if retained on canonical live domain. Keep admin noindex. No active `LocalBusiness`/`Store` JSON-LD, canonical tags, OG/Twitter, sitemap, robots, llms.txt, manifest, or verified entity graph in deployed source trees. Demo-only `reference/demo/robots.txt` and `sitemap.xml` do not count. No map, exact address, regular/special hours, or delivery area on home beyond Mallepally, Hyderabad and a call-to-confirm prompt. **Opening hours accuracy UNVERIFIED**, not evidence of incorrect hours; do not infer open now from acceptingRequests or stock. No dates/times invented. Public search for exact shop name/locality/phone did not return a reliable exact match; similar businesses are not evidence. GBP existence, verification/ownership, category, pin, NAP consistency, hours, photos, posts, reviews and catalogue alignment UNVERIFIED. No reviews or licence/halal/FSSAI claims added. [NEEDS CLIENT INPUT] exact profile link/pin, verified address and hours (including holiday exceptions), pricing/delivery/claims/approved photos. No new review-request flow until genuine profile verified.

Official standards checked: https://web.dev/articles/vitals ; https://www.w3.org/TR/WCAG22/ ; https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html ; https://developers.google.com/search/docs/appearance/structured-data/local-business ; https://developers.google.com/search/docs/appearance/establish-business-details . The directive's stricter project budgets take precedence over generic good thresholds. LocalBusiness data must reflect real visible facts; no fabricated `openingHoursSpecification`, rating or review markup. No claim of search ranking.

## 8. Twenty highest-impact gaps (ranked audit findings)

Severity: P0 = blocks safe integration/launch or binding acceptance; P1 = major quality or business gap; P2 = secondary. Effort is qualitative S/M/L, not a time estimate. Findings are not an approved phased PR plan.

| Rank | Severity × effort | Finding and path | Evidence / acceptance needed |
|---:|---|---|---|
| 1 | P0 × S | Owner route reverted in PR #6 — `src/pages/admin/index.astro` | Confirmed red e2e, compare blobs; restore existing route via reviewed reconciliation, not new UI |
| 2 | P0 × M | Main docs-only; production older, drift across branches — `main`, `.github/workflows`, `AGENTS.md`, `CLAUDE.md`, absent `docs/HANDOFF.md` | Read-only branch inventory; agree integration baseline, preserve Claude changes, protect main, full directive/handoff later |
| 3 | P0 × M | No verified live owner auth/provisioning; all 13 charging units null — `src/components/OwnerConsole.tsx`, `src/lib/catalogue/firebase-browser.ts`, `src/data/products.ts` | Real owner Google login, revocation, synthetic staging saves then approved live setup; [NEEDS CLIENT INPUT] rate/unit decisions |
| 4 | P0 × M | Production order builder has unsafe malformed Unicode and no URL limit guard — `src/lib/order/order.ts` at cad4cc3 | Later implementation contains fixes; validate and promote only when authorised |
| 5 | P0 × M | No verified response security headers / CSP / abuse controls — absent `public/_headers`, `.github/workflows` | `curl -I`, staged CSP report-only, Google popup compatibility (strict COOP may conflict), secret scan, threat model, quota/rate-limit review; production UNVERIFIED |
| 6 | P0 × M | Customer JS ≤60 KB unmeasured, React hydration plus configured SDK risk — `src/pages/index.astro`, `Catalogue.tsx`, `firebase-public.ts`, `firestore.ts` | Cold network trace and gzip accounting for actual configured build; prevent regressions in CI |
| 7 | P0 × S | 268,039-byte header logo — `public/images/logo.png` | Retain source; optimize display variants and measure total payload; not measured LCP asset |
| 8 | P0 × M | Current LCP/INP/CLS/TBT/TTFB unknown; no performance budgets in CI — `.github/workflows/verify.yml` | Lighthouse mobile/desktop, slow 4G, field data and device notes; no score until measured |
| 9 | P0 × M | Configured customer flow and failure transitions not browser tested — `Catalogue.tsx`, `ReviewSheet.tsx`, `freshness.ts`, `tests/e2e/catalogue.spec.ts` | Synthetic configured staging: rates change, unavailable, stale known-blocked, copy path, delivery, grant expiry, network failure; real WhatsApp phone test |
| 10 | P0 × M | A11y acceptance missing, pale borders and potentially shrunken steppers — `src/styles/global.css`, `owner.css`, `Stepper.tsx` | axe, actual target rectangles/spacing, WCAG non-text contrast, keyboard, forced colors, screen readers |
| 11 | P0 × M | No verified launch SEO / indexing; no JSON-LD, sitemap or canonicals — `src/pages/index.astro`, `public/` | Preview remains noindex; validate factual canonical markup before launch approval |
| 12 | P0 × S | Opening hours and holiday exceptions, exact pin and GBP verification missing — `src/pages/index.astro` | [NEEDS CLIENT INPUT] profile link, exact NAP, schedule and delivery terms; no false open status |
| 13 | P1 × M | Cut selections and prices not customer-approved — `src/data/products.ts`, `ReviewSheet.tsx` | [NEEDS CLIENT INPUT] actual cuts, quantity increments, charging basis, rates; owner editor must work without developer for daily updates |
| 14 | P1 × M | Multi-script UI and fallback not validated — `src/pages/*.astro`, `src/styles/global.css`, `order.ts` | [NEEDS CLIENT INPUT] languages, then native-speaker and Android RTL/Indic testing |
| 15 | P1 × L | Core request is JS-dependent; no direct no-JS WhatsApp enquiry — `src/pages/index.astro`, `Catalogue.tsx` | Native static fallback with call/direct enquiry; no claim that no-JS basket works |
| 16 | P1 × M | Owner uncertain-save intent memory-only, mobile redirect unverified, hours/photos/text not editable — `OwnerConsole.tsx`, `docs/OWNER_CONSOLE.md` | Safe recovery and conflict UX, real owner phone trial; no offline auto-writes; owner content scope decision |
| 17 | P1 × M | 14 moderate emulator advisories; no enforced full supply-chain/secret/lint checks — `firebase/package-lock.json`, CI | Current audit and triage, targeted compatible upgrade, keep dev-only isolation; pin/test actions and add budget gates |
| 18 | P1 × M | Privacy statement incomplete for owner auth, Firebase/network, rights and retention — `src/pages/privacy.astro`, `storage.ts`, `docs/OWNER_CONSOLE.md` | Data map, rights/contact/retention and policy review; no invented legal claims; verify third parties |
| 19 | P1 × L | Missing real-photo-led hero, cuts guide, trust content, designed component states, QR/GBP alignment — `src/pages/index.astro`, `ProductCard.tsx`, CSS | [NEEDS CLIENT INPUT] approved real assets and truthful sourcing/claims, preserve logo; performance-first visual pass |
| 20 | P2 × M | No design-system route, 404/offline/manifest, cross-browser visual snapshots, accessibility statement, owner runbook and final evidence bundle — `src/pages`, `docs/qa`, `tests/` | Evidence and docs; add PWA only if beneficial, not a heavy offline cache |

## 9. Dead code and unused dependencies

Confirmed source issue: `OwnerConsole.tsx` and `owner.css` are unreachable from the PR #6 admin page; they are not safe to delete because they are intended working features on integrated development. The reference demo has duplicate logo (same Git blob) and old robots/sitemap, deliberately outside deployment. Keep archive until deletion is approved. No heavy animation dependency; `astro`, React/React DOM, Lucide, Firebase, TypeScript, Vitest and Playwright have apparent uses in development, while Firebase CLI lives in separate tooling lockfile. Root `@firebase/rules-unit-testing` is used by SDK tests. Unused exports, tree-shaken assets, dead CSS, exact dependency reachability, secret scanning and `knip` are UNVERIFIED; do not declare clean or delete anything on this evidence. `npm run lint` absent. Source contains non-null assertions, e.g. `ReviewSheet.tsx` product lookup. CI does not enforce full Part E. GitHub Actions Node 20 deprecation warning present even with SHA-pinned actions.

## 10. Real tool output and evidence provenance

### Commands attempted in this session (28 Nov)

```
$ git status --short --branch
fatal: not a git repository (or any of the parent directories): .git
$ git ls-remote https://github.com/immazhark/moin-mutton-mart-site.git HEAD refs/heads/main
fatal: unable to access 'https://github.com/immazhark/moin-mutton-mart-site.git/': Could not resolve host: github.com
$ node --version
v22.16.0
$ npm --version
10.9.2
$ command -v chromium
/usr/bin/chromium
$ npm ping --fetch-retries=0 --fetch-timeout=4000
npm notice PING https://registry.npmjs.org/
npm error code EAI_AGAIN
npm error syscall getaddrinfo
npm error errno EAI_AGAIN
npm error request to https://registry.npmjs.org/-/ping failed, reason: getaddrinfo EAI_AGAIN registry.npmjs.org
$ curl -I --max-time 5 https://moinmuttonmart.in/
curl: (28) Resolving timed out after 5001 milliseconds
$ curl -I --max-time 5 https://moin-mutton-mart-site.pages.dev/
curl: (6) Could not resolve host: moin-mutton-mart-site.pages.dev
```

No installed Lighthouse executable found. No checkout or node_modules; fresh build/test/audit/Lighthouse/axe cannot run. Public website opens via web also returned inaccessible. Do not equate environment network failure with site downtime. Static color calculations in section 6 are new measurements. File size is from Git tree metadata, not HTTP transfer.

### Existing GitHub CI logs retrieved read-only (27 Nov; NOT reruns)

PR #6 head `4c113f1`, [Development verification](https://github.com/immazhark/moin-mutton-mart-site/actions/runs/45963456018), job `140386528731`, overall failure:

```
found 0 vulnerabilities
- 0 errors
- 0 warnings
- 0 hints
Tests  60 passed (60)
08:09:45 [build] output: "static"
08:09:45 [build] mode: "static"
08:09:45   ├─ /admin/index.html (+7ms)
08:09:45   ├─ /privacy/index.html (+2ms)
08:09:46   ├─ /index.html (+96ms)
08:09:46 [build] 3 page(s) built in 618ms
08:09:46 [build] Complete!
1) tests/e2e/owner.spec.ts:3:1 › unconfigured owner route fails closed without Firebase network requests
Error: expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: 'Owner access is not connected' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
1 failed
10 passed (10.3s)
```

ANSI formatting/timestamps removed from selected lines, values unchanged. The ten passing tests are the customer suite; the failing owner test stops full merge acceptance. [SDK verification on same head](https://github.com/immazhark/moin-mutton-mart-site/actions/runs/45963456028) reports `found 0 vulnerabilities` for root install/audit, `14 moderate severity vulnerabilities` for emulator tooling, `Tests 7 passed (7)`, high-severity gate passed. [Prior merged owner PR verification](https://github.com/immazhark/moin-mutton-mart-site/actions/runs/45963139855) tested `42ba53e...`, not PR #6: `found 0 vulnerabilities`, `0 errors`, `0 warnings`, `54 passed (54)`, `9 passed (8.9s)`. [Rules emulator verification](https://github.com/immazhark/moin-mutton-mart-site/actions/runs/45960001766) tested earlier commit with same rules blob: `tests 10`, `pass 10`, `fail 0`. These are historical synthetic tests, not deployed Rules verification. Earlier CI warnings include deprecated `punycode` and `url.parse()`, Actions Node 20 runner warning, and a chunk-size warning in owner build. Current security posture is not proved by clean npm audit alone.

## 11. Commands to collect missing evidence (run in a disposable local checkout)

Use Bash / Git Bash with Node 24, npm, Python 3, Chrome/Chromium, Git and adequate internet access. This creates only a **local** audit workspace and branch, does not touch your working repo, does not push, and does not deploy. Store results outside Git. First inspect and pull main as rule 7 requires. Use exact audited heads (do not silently measure a different commit). If remote heads have changed, record them and report before comparing. Run each section even if e2e fails; do not hide failures. Do not copy production `.env` or use real database credentials. No actual WhatsApp message needs to be sent.

### A. Fresh repository and test outputs

```bash
QA_ROOT="$(mktemp -d)"
export QA_ROOT
cd "$QA_ROOT"
git clone https://github.com/immazhark/moin-mutton-mart-site.git repo
cd repo
git switch main
git pull --ff-only origin main
git status --short --branch
git log -5 --oneline
git fetch origin --prune
git branch -avv
git switch -c audit/chatgpt-audit-0-20261128 4c113f1cddf2dac4154eb707b861bd02197e2c37
git rev-parse HEAD
git status --short --branch
node -v
npm -v
npm ci --ignore-scripts 2>&1 | tee "$QA_ROOT/npm-ci.log"
npm run check 2>&1 | tee "$QA_ROOT/check.log"
npm test 2>&1 | tee "$QA_ROOT/unit.log"
npm run build 2>&1 | tee "$QA_ROOT/build.log"
npx playwright install chromium
npm run test:e2e 2>&1 | tee "$QA_ROOT/e2e.log"
npm audit --json > "$QA_ROOT/npm-audit.json"
npm audit --omit=dev --json > "$QA_ROOT/npm-audit-runtime.json"
(cd firebase && npm ci --ignore-scripts && npm audit --json > "$QA_ROOT/emulator-audit.json")
git status --short --branch
```

Use `set -o pipefail` if running as a shell script; tee otherwise masks nonzero exit status. Preserve actual exit codes. Main is docs-only, so running npm on main is invalid. Repeat applicable tests in a separate local worktree at `f57164d...` and `cad4cc3...` (old branch uses `playwright.config.ts` and its old dev-server setup; do not silently fix it during audit). Existing CI uses Node 24. For real SDK and Rules tests, Java 21 and demo project only:

```bash
(cd firebase && npm test) 2>&1 | tee "$QA_ROOT/rules.log"
./firebase/node_modules/.bin/firebase emulators:exec --config firebase/firebase.json --project demo-moin-security --only firestore 'npm run test:emulator' 2>&1 | tee "$QA_ROOT/sdk.log"
```

### B. Lighthouse mobile and desktop (local built snapshot and live URL)

Start local server in same shell (or a separate terminal from repo), leave running for C:

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

In another Git Bash terminal, set `QA_ROOT` to the same absolute path printed by `echo "$QA_ROOT"` in A and `cd "$QA_ROOT/repo"`. Record Lighthouse version. CLI default mobile simulated throttling; explicitly select mobile and simulated throttling. Run three cold mobile runs per route and retain every report (median for comparison, no cherry-picking). Desktop single run at minimum. These test **unconfigured** builds only, not Firebase-loaded public journey. Run against the Cloudflare preview URL only if still matches audited hash; canonical domain only after checking what it serves. Chrome must be installed; use `CHROME_PATH` if necessary.

```bash
npx --yes lighthouse --version
for route in home admin privacy; do
  case "$route" in home) path=/;; admin) path=/admin/;; privacy) path=/privacy/;; esac
  for run in 1 2 3; do
    npx --yes lighthouse "http://127.0.0.1:4173$path" --form-factor=mobile --throttling-method=simulate --chrome-flags="--headless" --output=json --output-path="$QA_ROOT/lh-$route-mobile-$run.json"
  done
  npx --yes lighthouse "http://127.0.0.1:4173$path" --preset=desktop --chrome-flags="--headless" --output=json --output-path="$QA_ROOT/lh-$route-desktop.json"
done
npx --yes lighthouse https://09954dd3.moin-mutton-mart-site.pages.dev/ --form-factor=mobile --throttling-method=simulate --chrome-flags="--headless" --output=json --output-path="$QA_ROOT/lh-pages-production-mobile.json"
npx --yes lighthouse https://549dc110.moin-mutton-mart-site.pages.dev/ --form-factor=mobile --throttling-method=simulate --chrome-flags="--headless" --output=json --output-path="$QA_ROOT/lh-pr6-mobile.json"
```

Record tool versions and JSON configuration; no production credentials. Lighthouse SEO intentionally sees noindex on preview. Lighthouse TBT is a lab proxy, not field INP; real-user p75 requires field measurement after sufficient traffic. Test a real low-end Android separately.

### C. axe, actual target rectangles, source/transfer accounting

Install axe in temporary tools directory, not project dependencies, and use existing Playwright. Run this exact Bash command in repo while server B is running. Measures response-body gzip **estimate** for distinct JS files downloaded during a cold local page load (not actual edge wire bytes). `ResourceTiming` gives actual local transfer metrics, which differ from edge compression. Measure configured isolated preview separately. Includes review dialog scan and a screenshot; no message sent.

```bash
npm install --prefix "$QA_ROOT/tools" --no-save --no-package-lock --ignore-scripts axe-core
export AXE_JS="$QA_ROOT/tools/node_modules/axe-core/axe.min.js"
node --input-type=module <<'JS' | tee "$QA_ROOT/axe-and-assets.log"
import { chromium } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({headless:true});
for (const width of [320,360,390,430,1280]) {
 const page = await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
 const resources = new Map();
 const pending=[];
 page.on('response', r => { if (r.request().resourceType()==='script') pending.push(r.body().then(b=>resources.set(r.url(),{raw:b.length,gzip:gzipSync(b).length})).catch(()=>{})); });
 await page.goto('http://127.0.0.1:4173/');
 await page.waitForLoadState('networkidle');
 await Promise.all(pending);
 console.log(JSON.stringify({width,jsFiles:[...resources],gzipSum:[...resources.values()].reduce((s,v)=>s+v.gzip,0),resources:await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({name:r.name,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize})))}));
 async function scan(name){
  await page.addScriptTag({path:process.env.AXE_JS});
  const report=await page.evaluate(async()=>await window.axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
  writeFileSync(`${process.env.QA_ROOT}/axe-${name}-${width}.json`,JSON.stringify(report,null,2));
  const targets=await page.locator('button,a,input,select,textarea,summary').evaluateAll(els=>els.filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&!e.classList.contains('skip');}).map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label')||e.textContent?.trim().slice(0,80)||e.tagName,width:r.width,height:r.height};}).filter(r=>r.width<44||r.height<44));
  console.log(JSON.stringify({name,width,axeViolations:report.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),smallTargets:targets}));
  await page.screenshot({path:`${process.env.QA_ROOT}/${name}-${width}.png`,fullPage:true});
 }
 await scan('home');
 await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
 await page.getByRole('button',{name:'Review request'}).click();
 await scan('review');
 await page.goto('http://127.0.0.1:4173/admin/'); await scan('admin');
 await page.goto('http://127.0.0.1:4173/privacy/'); await scan('privacy');
 await page.close();
}
await browser.close();
JS
```

`axe` injection is after resource capture, so audit JS is excluded from first-load size. Rectangles are candidates, not definitive failure: labels may enlarge actual target; disabled/offscreen states, 8px spacing, focus and screen-reader behavior need manual review. Install pa11y outside repo via `npx --yes pa11y --version`, then `npx --yes pa11y --standard WCAG2AA http://127.0.0.1:4173/ --reporter json > "$QA_ROOT/pa11y-home.json"`; repeat for admin/privacy. On Windows adapt shell variable syntax only if not using Git Bash.

### D. Header, source and dependency evidence

```bash
for url in https://moinmuttonmart.in/ https://moin-mutton-mart-site.pages.dev/ https://549dc110.moin-mutton-mart-site.pages.dev/; do
  curl -sS -I --max-time 20 "$url"
  curl -sS -I --max-time 20 "${url}admin/"
done | tee "$QA_ROOT/headers.txt"
find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.png' -o -name '*.webp' -o -name '*.avif' -o -name '*.woff2' \) -print
wc -c public/images/logo.png
npx --yes knip --reporter json > "$QA_ROOT/knip.json"
git status --short --branch
```

Inspect headers for actual HTTPS, CSP, HSTS, nosniff, referrer, permissions, COOP/CORP and cache policy. Only run ZAP/Observatory on explicitly approved target (no active scan of production without consent). Use Schema Markup Validator/Rich Results Test after factual schema exists; check Google Business Profile using owner-provided profile URL, not a similarly named listing. Add manual device notes: Android on mobile data, WhatsApp compose with pickup and delivery (do not send), Urdu/Telugu/Devanagari notes, browser back, 200% text, keyboard, TalkBack, iOS Safari, no-JS, reduced-motion and forced-colors. WebKit/Firefox currently UNVERIFIED. No production write or sign-in trial without approval.

## 12. Part E evidence gate and external inputs

| Required evidence | Status |
|---|---|
| Lighthouse mobile/desktop & measured budgets | UNVERIFIED |
| axe/pa11y & manual keyboard/screen reader | UNVERIFIED |
| Security headers/CSP/Observatory/ZAP/secret scan | UNVERIFIED; historical npm audit only |
| Schema/robots/sitemap/canonical/hreflang | Source missing; validator UNVERIFIED |
| Playwright + cross-browser visual snapshots | Chromium partial; PR #6 10/11; visual/WebKit/Firefox UNVERIFIED |
| Android/iPhone/tablet/4K real device | UNVERIFIED |
| No-JS/reduced motion/forced colors | CSS/source partial, screenshot UNVERIFIED |
| Knip/bundle analysis | UNVERIFIED |
| B3 wow pass | Provisional below bar; actual visual evidence UNVERIFIED |
| Severity-ranked open issues | Provided above |

External client decisions, not duplicate engineering tasks: [NEEDS CLIENT INPUT] (1) exact GBP/Maps profile link, approved address and regular/holiday hours; (2) current price/charging-unit/quantity/cut list including chicken weight basis; (3) actual delivery area/terms and WhatsApp Business catalogue confirmation; (4) authorised customer language scope; (5) real photos and substantiated trust/food-safety claims, if the owner wishes to publish them. Previously supplied admin identity is not requested again or exposed. Production Firebase bootstrap, DNS/canonical cutover, account/phone acceptance and public launch remain separately gated. No need to buy a tool or service to collect baseline evidence.

**What changed:** audit/handoff artifacts only; no remote changes. **How to verify:** run section 11 and provide logs/JSON/screenshot results, including failures; use exact commit and record environment. **Still open:** Step 1 measured evidence, PR #6 red CI, owner and business facts; Step 2 phased PR plan deliberately not started. Stop here.
