# Release evidence and operational gate — Phase 9

28 November 2026. Development ce39d31 integrates PRs #7–14. Phase 9 collects evidence and documents release readiness; it is **not** production approval. Existing source directives remain authoritative. User's renewed execution instruction is interpreted as authorization to collect isolated evidence, not to deploy, enable indexing, change Rules/data or spend. Local DNS unavailable, so exact GitHub API and runner evidence used. The earlier deferred local Lighthouse/axe measurements are now attempted in a controlled isolated CI lab; actual live/field/device acceptance remains deferred.

## Part E checklist (initial, before new lab runs)

| Required evidence | Status and exact source |
|---|---|
| Mobile and desktop Lighthouse | UNVERIFIED until new isolated lab actually returns reports. Ordinary build has no live config and intentionally noindex, so SEO score is not a launch score. |
| Measured budget table | Configured 2c1efc6 CI 46121930895: JS gzip 10,644/60,000 B PASS; static estimate 22,112/500,000 B PASS (excludes live response/transfer); CSS gzip 4,564/60,000 B PASS; inline CSS 0/14,000 B PASS; logo 2,012/90,000 B PASS at tested viewport; no web fonts. LCP, CLS, TBT, TTFB and INP pending actual lab/field; no timings inferred from bytes. |
| Axe/Pa11y and manual assistive tech | New lab attempts automated scans. Existing keyboard, touch and 200% reflow regressions pass, not full WCAG conformance. Actual screen readers and manual review still required. |
| Security headers and scanning | Local modeled headers tested, staged CSP only. Actual curl -I, enforcement, Observatory/securityheaders grade, approved ZAP baseline, osv-scanner pending; Gitleaks passed 46121930923; root audit zero; 14 moderate isolated CLI advisories remain. No unauthorized production scan or enforcement. |
| Structured data / sitemap / robots | CI static parsing, noindex, canonical and sitemap passed; incomplete address and exact pin require verified facts, external validator and actual canonical launch checks pending. No hreflang until actual localized pages. |
| Browser journeys + visual snapshots | 44 Chromium, 2 Firefox, 2 WebKit, 3 configured Chromium pass exact Phase 8 head. Actual 7 viewport screenshots and review screenshot inspected; repeatable captured lab artifacts added, not established screenshot-diff baseline; physical Safari/Chrome not yet verified. |
| Physical devices and 4G | UNVERIFIED. Need low-end Android, actual iPhone Safari, tablet and 4K desktop. |
| No-JS, reduced motion, forced colors | Existing browser checks passed; new lab attempts screenshot artifacts. |
| Knip / bundle | Knip clean exact head. Static browser-observed asset inventory and isolated lab gzip inventory; bundle-analysis visual not yet accepted. |
| Wow-pass B3 and Master §15 | Provisional visual B3 7.5/10, NOT met, fix list in VISUAL-REVIEW-8.md. No full 95/100 score. |
| Open issues | See below. |

## Evidence runner

The new GitHub workflow uses Node 24, existing lockfile, isolated runner temp tools (Lighthouse 13.6.0, axe-core 4.14.1, Pa11y 10.0.0 exact top-level pins), ignore-scripts and high-severity audit before running; temporary tool transitive dependencies are not fully locked. All routes on loopback port 4324, explicit disconnected build, no production credentials or external order navigation. Ordinary build, synthetic review only. Lighthouse mobile/desktop JSON reports, axle/HTML_CodeSniffer output, screenshots, build inventory and actual runner errors saved as 14-day CI artifacts. Report collection success is not an accessibility or Lighthouse pass; inspect all findings and incomplete/manual items. Runner errors fail the collection job; audit violations/scores remain explicit data, not hidden by a passing job. Never interpret Lighthouse lab navigation INP as field data. Sources: https://github.com/GoogleChrome/lighthouse ; https://github.com/dequelabs/axe-core ; https://github.com/pa11y/pa11y .

## Severity and launch ownership

- P0 release blockers: verify approved real Firebase owner access and authorized publication/recovery; actual rate/charging unit and availability model owner acceptance; production routing and HTTPS/headers/CSP compatibility; noindex removal on approved canonical only; privacy/retention approval; actual business contact and request/WhatsApp handoff acceptance; resolve any critical accessibility/security or functional regression.
- P1: actual physical-device and assistive-tech checks, Lighthouse/mobile lab and field performance; verified address/pin/GBP/hours/delivery, genuine imagery and final B3/§15 rubric; external schema validation, approved staging ZAP and osv-scanner, actual response headers. Missing input is not permission to invent facts.
- P2: monitor isolated CLI advisory resolution, independently review exact tooling and artifacts, optional justified typography/imagery changes within budget; training crawler decision.
- Historical 12 Rules cases passed Phase 2; code unchanged. Do not claim fresh exact-head Rules until actually run. Existing production branch cad4cc3 and main 6bbcdf6 unchanged; domain attachment only pages.dev at last Cloudflare read.

## Owner acceptance / rollback

1. On approved staging only, verify genuine owner login, membership, sign-out, rate edit/toggle/stock, save one authorized test update, exact-revision conflict/retry, audit and backup; do not use production data without explicit approval. Restore only through verified audited save after reviewing newer revisions. Never erase audit or use blanket rules.
2. Owner verifies real facts, WhatsApp recipient and format, cut/quantity/price/stock/delivery/collection/hours, privacy rights/retention, genuine photographs, branding and approved local profile. Test customer manually sends a clearly labelled test enquiry only with prior authorization; no auto-submit.
3. On real devices, test navigation at small viewport, keyboard, touch, zoom, voiceover/TalkBack, reduced motion, forced colors, offline fallback, recovery, language notes and actual 4G; retain dated evidence.
4. Separate launch authorization after all Part E and B3 gates. Record prior known-good deployment SHA/URL, current Pages production branch, domain/DNS/Rules/auth/data backup state and exact rollback operator. Stage canonical/noindex configuration, verify preview stays noindex; then only approved promotion. If bad deploy, revert to prior verified Pages deployment via authorized dashboard/API, restore prior launch metadata and verify actual headers/health. Code rollback alone does not undo Firestore data; preserve audit and recover with reviewed transaction. Never blindly restore a backup or change DNS/Rules/data without approval.
5. After approved launch verify actual public 200/404, TLS, redirects, response security/cache headers, real canonical/robots/sitemap, actual social preview and Search Console/Bing; no rank guarantee. Monitor issues using approved tools only.

No production-ready declaration. Review exact CI logs and artifact summaries, update this document and living matrix with observed findings, then fix unblocked issues under authorized branch. Do not relax targets or suppress valid findings. See QUALITY-RUNBOOK.md, VISUAL-REVIEW-8.md, LOCAL-DISCOVERY.md, PRIVACY-DATA-MAP.md and OWNER_CONSOLE.md.
