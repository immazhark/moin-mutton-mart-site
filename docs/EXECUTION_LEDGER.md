# Execution ledger — Moin implementation plan

Base: 6bbcdf63a55c47d26d8450cb5c63fae7f3f4bffb
Branch: feat/modern-market-storefront

Ruling: User approval selects B + C and supersedes pending selection language. Costs if wrong: visual rework; no live services affected.
Ruling: Keep all pricing bases null until selling units are approved. Proposed steps express requested quantities, not confirmed sale units. Costs if wrong: owner adjusts steps before launch.
Ruling: Implement safe unpriced enquiry storefront before live catalogue schema/backend. No live rate or availability claims; no fake admin save. Costs: live operations remain outstanding.
Domain tests initially failed on missing order module; implemented and 9 tests passed. Storage tests initially failed on missing module; implemented and 11 tests passed.
Astro type check and static build pass. Browser checks blocked before launching any page by missing system Chromium; replacement download HTTP 403. Five viewport journey tests remain unverified.
Self-review: checked original asset archive, preview noindex, rate qualification, note encoding, note non-persistence and admin disabled state. Secure owner publication and mobile visual review are outstanding and must precede production launch.
