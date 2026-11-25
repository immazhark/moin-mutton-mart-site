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
