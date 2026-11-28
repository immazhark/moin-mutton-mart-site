# Repeatable engineering quality gates

Phase 7, 28 November 2026. The active development branch is feat/premium-counter-redesign. Do not publish production, seed live data, or change DNS/Rules/indexing/billing without separate approval.

| Check | Command or workflow | Scope |
|---|---|---|
| Reproducible app install | npm ci | Existing root lockfile, Node 24 CI, no new runtime dependency |
| Type and narrow lint | npm run check / npm run lint | Astro type checks plus noUnusedLocals/noUnusedParameters. Not full ESLint/CSS lint. |
| Domain tests | npm test | Vitest exact shape, order/storage/publication/recovery/freshness/Unicode/etc |
| Static build | npm run build | Astro; no customer React hydration; responsive logo; 404, privacy, admin |
| Standard browser | npx playwright install --with-deps chromium; npm run test:e2e | Isolated loopback server, all 11 widths, geometry/reflow/keyboard, privacy, 404, asset/QA isolation, noindex, security headers, static budget |
| Portable smoke | npx playwright install --with-deps firefox; PLAYWRIGHT_BROWSER=firefox npm run test:smoke | Two tests on Firefox at mobile CSS widths; use webkit instead for WebKit; Chromium also runs these cases |
| Unused code | .github/workflows/unused-code-audit.yml | Knip 6.41.0 isolated, ignore-scripts, audit before execution, strict findings gate, explicit entry for emulator config; temporary transitive dependency graph not lockfile-pinned |
| Security | Repository security scan; root audit; SDK dependency audit; Rules and SDK emulators | Redacted pinned scanner, least-privilege read-only CI; root 0 advisories at 78102b5, isolated Firebase CLI 14 moderate still open |
| Configured customer/owner | .github/workflows/sdk-emulator.yml | Disposable loopback demo project only; real unauthenticated REST read and authenticated audited transaction/replay; synthetic charging bases; no real credentials or actual WhatsApp send |

Never run a configured emulator fixture on a real host. No production test endpoints or QA harness in deployable source. The build artifact test rejects test markers and private paths; not a substitute for full security review. The Python server intentionally models specific Pages static headers and 404 only; not an exact Cloudflare emulator. Unknown routes must return a real 404, not a successful SPA fallback. The native 404 includes call/home paths even without JavaScript.

Observed at implementation 78102b5: 77 unit, 36 Chromium, 7 SDK, 3 configured browser, 2 Firefox and 2 WebKit test executions passed; 127 total runs, some scenarios repeat across engines. Knip zero findings in its configured scope; root audit zero, secret scan pass. Exact runs in HANDOFF. Browser-observed gzip estimates (not CDN transfer): configured JS 10,515 B, static first view 20,928 B, CSS 3,405 B gzip, inline CSS 0 B, displayed logo 2,012 B. Hard caps remain unchanged.

Visual evidence: capture actual rendered screenshots at required widths with exact commit/URL, identify source/synthetic/live data; do not fabricate scores. Local browser tests emulate viewport and not physical devices, Safari itself, real assistive tech or network. Full Lighthouse/axe, CWV, actual HTTP headers and security policy, real Google auth, shop data, phone acceptance, design rubric and production release remain gated. No PWA or offline authoritative pricing introduced. Avoid false positive cleanup: reference/demo, original logo, historic source in Git, rulebooks and lockfiles preserved. Stop at each phase verification boundary; use living matrix and handoff.
