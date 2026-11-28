# Moin Mutton Mart — architecture and build brief

Date: 25 November 2026
Status: architecture accepted as planning direction; free-tier implementation plan prepared. B + C hybrid visual direction approved; see DESIGN_DIRECTION.md. No implementation, provisioning or deployment claimed.
Canonical repository: https://github.com/immazhark/moin-mutton-mart-site
Domain: https://moinmuttonmart.in — purchased through Spaceship.

## Binding budget and architecture decision

Free tiers only. No premium subscriptions, paid trials, linked Cloud Billing or automatic paid upgrades. Existing domain renewal remains separate. Stack: Astro, TypeScript, React islands, custom CSS, Cloudflare Pages, Firebase Spark Google Authentication and Cloud Firestore Standard. Product photographs are static assets. No Firebase Storage, Cloud Functions, App Hosting, SMS authentication or paid messaging API.

This revision replaces the Supabase proposal completely. Firestore free quotas include 1 GiB stored data, 50,000 document reads/day and 20,000 writes/day; monitor both reads and transfer. Quota exhaustion must degrade to static shop information and unpriced enquiries, never a paid upgrade. Service terms may change; free operation is bounded by current allowances, not guaranteed indefinitely.

## 1. Intent and confirmed requirements

Create a distinctive premium local meat-shop website for Moin Qureshi's Moin Mutton Mart in Mallepally, Hyderabad. This is Mazhar's first independent small-business project. Quality of design and execution matters beyond the package price, but operating cost and owner workload must remain appropriate to a small shop.

Confirmed: retain existing logo; mobile-first customer experience; familiar quick-commerce catalogue behaviour inspired by Licious, Blinkit and Instamart; owner uses mobile only and must edit prices and availability without a developer; real photographs will be supplied; customer requests go to WhatsApp. Existing Claude demo is a reference scaffold, not an approved final design.

Business information from handover: Noble Takis, beside Al Ameen Hotel, Mallepally X Road, Hyderabad. Primary phone/WhatsApp +91 8143730054; secondary phone +91 9347055856. Instagram https://www.instagram.com/moin_mutton_mart/ . Confirm exact address spelling and map pin before launch. Opening hours, delivery boundary, minimum, fees, licence details and product prices remain unconfirmed.

Repository was last observed empty and public earlier in this conversation. Recheck before any push. Do not put financial arrangements, private emails, auth identities, customer messages or secrets in a public repository.

## 2. Approaches considered and selected planning direction

1. Plain HTML/CSS/JavaScript: minimal tooling and suitable for a brochure, but interactive catalogue and admin need explicit component/state organisation.
2. Astro + TypeScript with React islands: static, readable business content combined with isolated catalogue and admin applications. Recommended and used as the planning baseline following user's instruction to proceed with stack planning.
3. A full server-rendered application: viable, but no current need for customer accounts, payments, fulfilment tracking or a large checkout platform. Adds work without a confirmed customer benefit.

Cloudflare Pages serves static Astro output. Firestore publishes live catalogue data. React is confined to catalogue and administration. Prices are retrieved at runtime; editing prices does not require builds. Google sign-in is for administrators only; no customer login.

Use custom CSS tokens and components; no generic template/theme. Pin dependencies and commit one package-manager lockfile. Static product/shop images are deployed with the website initially. Owner photo uploading is a later feature, separate from daily price edits.

## 3. Product scope and exclusions

Launch: mobile catalogue, categories, optional compact search, quantity selection, editable request basket, WhatsApp handoff, bulk enquiry, shop/delivery information, owner login, price/availability editing, change audit, accessible feedback and failures.

Later candidates: reviewed Urdu/Telugu translations, owner image upload, repeat selection shortcut, owner-approved dish guide, carefully validated quantity planner.

Not launch scope: payments, customer accounts, stock reservation/decrement, driver tracking, coupons, loyalty, chatbot, automated WhatsApp sending or order-management dashboard. A WhatsApp link is not a WhatsApp Business API integration.

## 4. Art direction and mobile layout

Approved direction: B + C hybrid. Compact charcoal header with existing gold crest, white cards on cool pale gray, maroon selected categories and green add/review/WhatsApp actions. Gold is reserved for branding. See DESIGN_DIRECTION.md.

Customer first viewport: compact logo/location header, short service message, visible categories and beginning of catalogue. No full-screen hero hiding products. Desktop may have a wider editorial introduction while retaining quick access to catalogue.

Two-column cards where usable at common phone widths; adapt rather than shrink content illegibly. Each card: authentic image, clear name, relevant cut attribute, correct unit, rate state, availability and ADD control. Product-image frame and lighting consistent. Unknown prices are never zero. No fake discount strikes, urgency, reviews or popularity labels.

Tabs: All, Mutton, Chicken, Speciality Cuts. Visible selected state, scroll affordance, no hover dependency. For the initial small range, filter by category; add text search only if useful in user testing. Synonyms can support paya/trotters and liver/kaleji after owner review.

Adding an item with choices opens an accessible bottom sheet; quantities are product-specific. Once selected, ADD becomes a clear edit/quantity control. Persistent bottom review bar displays item count and estimated total only when calculable. Mixed/unknown pricing must say that rates need confirmation, not show a partial sum as the full total.

Mobile safe-area padding, keyboard handling, comfortable touch targets (44px minimum proposed), visible focus, useful back behaviour, focus return after sheets, reduced motion and adequate contrast are mandatory. Keep primary flow practical at 320–430 CSS px. Desktop remains supported.

The user reviewed the three concepts and approved the B + C hybrid. Implement against DESIGN_DIRECTION.md.

## 5. Photo workflow

Collect original files: signboard and exterior, owner portrait, clean counter, each actual product separately, preparation/packaging and a ready order. Prefer indirect daylight, uncluttered light tray, consistent angle and space around the portion. No graphic slaughter or livestock footage in the customer storefront.

Preserve originals outside public assets. Produce edited derivatives: background cleanup, accurate colour correction, consistent scale, crop and subtle shadow. Do not fabricate meat texture, freshness or portion size. Obtain consent for identifiable people. Track filenames, rights and product mapping. Use labelled neutral placeholders during development; no competitor images or generated imagery presented as actual stock.

## 6. Routes and source structure

Proposed routes: / (catalogue and introduction), /delivery/ (confirmed terms), /visit/ (address, hours, directions), /privacy/ (actual data handling), /admin/ (owner app, noindex) and /auth/callback/ if provider flow needs it. Bulk enquiry may be a section or sheet. Avoid low-value area pages and thin product pages just for SEO.

Proposed application organisation:

- src/pages: Astro route shells and metadata.
- src/components/brand: shared header, footer and layout.
- src/components/catalogue: React catalogue, product cards, selectors and review sheet.
- src/components/admin: mobile editor and session states.
- src/lib: catalogue client, validation, price/quantity calculations, WhatsApp formatter and draft storage.
- src/styles: tokens, base styles and components.
- src/data: stable product identities/descriptions and no-price fallback data.
- public/images: optimised approved derivatives and logo.
- firebase: security rules, indexes, emulator configuration and rule tests.
- tests: meaningful calculation, authorisation and mobile journey coverage.
- docs: brief, decisions, content checklist, research, implementation status and owner guide.

Keep Firestore access behind a small catalogue module, without elaborate abstractions. One production database is authoritative for published rates and availability. Do not maintain competing price JSON and database copies.

## 7. Data model and publication protocol

Stable metadata lives in versioned src/data/products.ts: product id, name, category, image, description, unit and allowed quantities. Initial range: mutton with bone, boneless, leg piece, liver only, liver set, kidney, boti set, brain, head, paya four-piece set, live chicken, skinless chicken and desi chicken. Confirm unit/weight basis before enabling estimates. Range listing does not establish stock.

Firestore documents:
- public/catalogue: schemaVersion, revision, updatedAt, operationId, acceptingRequests and offers map keyed by the 13 fixed product IDs. Offer fields: enabled, pricePaise (nullable positive integer), availability (available/sold_out/ask), priceUpdatedAt and availabilityUpdatedAt. No private actor identity in this public document.
- admins/{uid}: active membership, readable by that user only and writable only through trusted project administration, not browser clients.
- audit/{operationId}: immutable actor UID, request timestamp, previous revision and complete validated next catalogue snapshot. Admin reads only. Client creation is permitted only when Rules verify it matches the same atomic catalogue update. No client update/delete.

One bounded public document reduces reads for the tiny catalogue. Each offer has explicit generated rule checks, fixed keys, value types and ranges; arbitrary nested maps are not accepted. Check size and Rule expression/document-access limits in emulator tests. Extending the range requires a reviewed metadata/rules update and safe compatibility deployment; daily price editing does not.

Save uses one online Firestore transaction: read catalogue, membership and operation record; compare expected revision; if already committed, return existing result; otherwise write revision+1 with server timestamp and create audit snapshot. Rules require membership, increment, timestamp=request.time, permitted changes, and matching audit record via getAfter. Audit create Rules validate its snapshot against getAfter(public/catalogue), previous revision and request.auth.uid. Catalogue deletion/creation from ordinary browser clients is denied. Bootstrap separately in the trusted project console. Rules prove an audited client update, not an independent server trigger; privileged project owners can bypass Rules and must be trusted.

Basket persistence holds only product IDs, integer grams/counts, bounded preferences, version and expiry. No customer contact/address or authoritative cached prices. Use session-scoped owner authentication by default; test phone usability and explain reauthentication when required.

## 8. Price, save and concurrency rules

Draft edits remain local until Save changes. Numeric inputs validate bounds; reject invalid/negative rates. Blank rate requires an explicit unknown-price choice. A batch save validates and commits atomically, with one audit snapshot for the entire save. Validate membership and expected revision inside the transaction. A conflict returns affected items for review rather than overwriting another administrator's changes.

Do not claim saved until server success. Preserve current draft in memory on failure, explain whether login/network/conflict caused it, and offer retry. Do not auto-submit an old offline draft when connection returns. Protect unsaved edits on navigation. An Undo feature, if included, is a new audited update checked against the current revision.

Separate product update times from fetch times. For unchanged morning rates, optional Confirm current rates action can record verification time explicitly; fetching never changes verification time. No automatic all-items-available reset at midnight.

## 9. Freshness and request flow

Render stable business/product descriptions in HTML. Do not bake volatile prices into the HTML build. Fetch current offers from the server on entry and before handoff. On returning to the tab, refresh only when the previous successful fetch is older than 60 seconds. Deduplicate in-flight reads; no background polling or realtime listeners initially. Use server reads for freshness, not cached Firestore snapshots. If the connection fails, fall back to an explicitly unpriced enquiry. Public reads are still subject to quota abuse; evaluate free App Check before launch, without treating it as authorisation or a quota guarantee.

Before handoff, fetch selected offers anew. If price/availability changed, show differences and require customer review. Sold-out selections must be removed or changed; ask-status items can become enquiries. If fresh fetch fails, offer an explicit unpriced availability enquiry or call, not a priced confirmation. Current data at handoff still does not reserve stock.

WhatsApp summary includes products, quantities, preparation requests, pickup/delivery preference and estimate qualification. Collect address in WhatsApp initially; optional website area is ephemeral. Use an explicit user tap, encode text safely and show destination business number. Provide copy-message and call fallbacks. Never send automatically or claim message delivery/order acceptance. Returning from WhatsApp preserves the editable basket, with an explicit Clear action.

Customer-visible explanation: Final availability, actual weight, total and delivery timing are confirmed by the shop. Confirm live-weight versus cleaned-weight charging with Moin before chicken estimates are implemented.

## 10. Owner experience and access

Proposal: Google sign-in using Moin's confirmed account, with a separately provisioned Mazhar administrator. Authorisation is a private allowlist of user ids enforced by database policies; successful Google sign-in alone gives no edit privileges. No public registration UI. Provision and recovery procedure documented; Moin never needs Firebase console access for daily work.

Daily screen: product name/photo, large rate input with immutable unit, available/sold-out control, optional Ask us state behind details, persistent save bar, count of changes and saved confirmation. Keep advanced product setup separate. Ask Moin's preferred interface language; start with clear English only if usable for him.

Use Firebase Google sign-in with explicitly authorised domains and tested popup/redirect behaviour on phones. Membership, not successful login alone, grants edit permission. No SMS or custom email-delivery dependency. Prefer popup sign-in with a tested mobile redirect fallback configured from official Firebase guidance; do not invent an /auth/callback route unless the chosen flow actually requires it.

## 11. Security and operational boundaries

Firestore Security Rules deny by default, allow a direct get of public/catalogue, deny collection listing and restrict edits to active administrators. Explicit field/type/range checks protect against malformed maps, arbitrary product IDs, role changes, audit spoofing and unauthorised writes. Authenticated non-admins cannot edit. Firebase client configuration is public by design; rules are the access boundary. Never commit Admin SDK credentials or private identities. Test membership revocation even with an existing signed-in session.

Escape text, avoid unsafe HTML, restrict authorised login domains and apply security headers. noindex is not authentication. Admin UI is a public static shell; its data and writes require verified identity and rules. No production credentials in previews.

Preview builds use fixtures or an isolated development backend; never production write credentials or broad OAuth wildcard redirects. Disable indexing on previews. Public-safe Firestore Rules, emulator tests and config only in git. Keep package lockfile and check dependencies deliberately.

No customer order database in release one. Analytics measures catalogue use and WhatsApp-button taps, not confirmed sales or message contents. Avoid recording addresses, text, phone numbers or auth tokens. Publish a concise truthful privacy notice.

## 12. Hosting, PWA and search

Astro static output to Cloudflare Pages, GitHub preview deployment, production from reviewed main. Domain stays registered at Spaceship. Cloudflare Pages apex hosting requires Cloudflare zone/nameservers; inspect and preserve existing DNS/mail records before changing nameservers. Set canonical apex and redirect www after verification.

Manifest, icons and suitable standalone presentation provide home-screen support where supported. Optional service worker caches versioned static assets only. Network-only for catalogue/auth/admin operations; no offline editing queue. An offline message must not imply ordering works offline. Home-screen installation is browser-dependent and never a forced popup.

Use canonical domain, consistent business identity, meaningful titles/descriptions, sitemap and crawlable real content. Confirm map pin/hours/delivery area before structured data. LocalBusiness data contains only supported facts, no invented reviews/rating or certification. Avoid build-time Product Offer prices that become stale. Product-rich-results work is secondary and must satisfy Google's actual eligibility requirements; do not add schema solely to imply guaranteed ranking.

Google Business Profile verification requires owner involvement and is a separate external dependency; site development can continue. No guaranteed Google/AI ranking claims.

## 13. Acceptance criteria and verification

- At 320/360/390/430px widths, no overlapping header, clipped controls or bottom-bar-covered content.
- Catalogue and empty/error states readable; touch and keyboard journeys complete; sheets manage focus correctly.
- Admin edits publish without a deployment; failed saves preserve drafts; concurrent edits are detected.
- Anonymous and signed-in non-admin writes fail; public role cannot read membership/audit; authorised edits succeed.
- Unknown, changed and unavailable prices handled honestly; no inaccurate partial estimate.
- WhatsApp URL/message formatting verified with special characters and multiple units; taps never report completed sales.
- Account/session and catalogue outage fallbacks exercised. No service key in public output.
- Proposed performance goals: LCP <=2.5s, INP <=200ms, CLS <=0.1 at the 75th percentile once field data exists; use representative throttled mobile lab checks before launch. Lighthouse 95+ is a target, not an unmeasured promise.
- Owner can update rate and mark sold out on his own phone after a short introduction; revise UI based on that observation.

Tests focus on money/quantity arithmetic, access boundaries, transactional save/conflicts and high-value mobile journeys. Continue unrelated work while CI runs, but never merge/deploy known failing essential checks.

## 14. Initial commit and delivery phases

Initial commit: README; AGENTS.md and CLAUDE.md pointing to shared docs; public-safe brief, architecture, research and owner-input checklist; existing logo; original demo archived clearly as reference; .gitignore. No raw commercial handover or live credentials. Do not publish the old demo automatically as production. Recheck current repository before import to avoid overwriting work.

After design selection: scaffold Astro/React/TypeScript, lockfile, tokens and fixtures; add .env.example with names only; implement one vertical slice; then add Firestore Rules and emulator tests, owner editor, full catalogue, photography and launch checks. Account provisioning and subscription selection are distinct from code preparation.

Phases:
1. Approve architecture and review three visual directions.
2. Implement fixture-backed storefront and owner-screen prototype.
3. Configure Firebase Spark without billing; implement catalogue, auth, atomic updates, audit and permission tests.
4. Join catalogue selection and WhatsApp handoff with freshness checks.
5. Integrate actual photos, shop information, SEO, fallback and owner trial.
6. Preview acceptance, verify production plan, DNS connection and launch.

## 15. Inputs and decisions still needed

Need before service configuration: account ownership/access, Moin's login identity and language. Need before catalogue launch: rates, pricing/weight basis, allowed quantities, species terminology, preparation options, delivery rules, hours, exact pin and approved photographs. Need before final copy: evidence/owner confirmation for daily freshness, halal wording and hygiene practices; never infer certification.

Can proceed now: shared documents, visual concepts, fixture design, data contracts and testing strategy. User photos and final rates need not block these.

## 16. Research sources

Retail pattern references (content/structure reviewed; not a complete rendered mobile/checkout audit):
- https://www.hgwalter.com/products/lamb-shoulder — product education, quantity and cooking context.
- https://www.turnerandgeorge.co.uk/ — craft, people and physical-store information.
- https://provenancebutcher.com/ — cooking-method and occasion navigation.
- https://www.farmison.com/ — visible delivery/minimum/packaging information.
- https://web.licious.in/faq — packed weight, availability and order explanations.
- https://www.freshtohome.com/poultry-mutton — explicit cut/weight/unit naming.
- https://www.godavaricuts.com/ — Hyderabad-specific positioning.
- https://carne.co.in/ — speciality-cut presentation.
- https://baymard.com/research-articles/product-listing-information — useful card attributes.
- https://baymard.com/research-articles/make-guest-checkout-prominent — avoid forced accounts.

Technical sources checked 25 November 2026:
- https://docs.astro.build/en/concepts/islands/
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/changelog.md — recheck relevant changes before implementation.
- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://web.dev/learn/pwa/caching
- https://developers.google.com/search/docs/appearance/structured-data/product

Recommendations in this document are design/engineering judgements drawn from the requirements and sources, not claims that competitor interfaces were fully tested or that services have already been configured.

## 17. Operational decisions and review resolutions

No automatic price expiry or midnight stock reset. Show actual timestamps; optional daily confirmation is distinct from price changes. When acceptingRequests=false, normal request flow is disabled; offer clearly labelled future enquiry/call. Hours and request acceptance are separate. No invented open status.

A timeout leaves save outcome unknown: check audit operation ID before retrying. Do not create duplicate audit records. Estimates round half-up to integer paise once per line. Product-specific price/quantity bounds must be reviewed with Moin. Never show a partial sum as a complete total.

Keep static metadata in git and live offer state in Firestore; never duplicate price authority. Removed products must be disabled safely across metadata and published data.

PWA caches only versioned public assets, never admin/auth documents, sessions, catalogue responses or mutations. No offline admin write queue. Preview admin runs against local emulator or isolated fixtures, not production.

Provide a manual admin-only JSON catalogue export and validated restore-as-new-revision. Store exports privately; restore cannot overwrite audit history. Paid managed backup/restore is excluded. Owner guide documents administrator replacement, membership revocation, domain renewal, quota review and contacting Mazhar when something fails.

Sources for revised backend: https://firebase.google.com/docs/firestore/quotas ; https://firebase.google.com/docs/projects/billing/firebase-pricing-plans ; https://firebase.google.com/docs/firestore/manage-data/transactions ; https://firebase.google.com/docs/firestore/security/rules-conditions ; https://firebase.google.com/docs/firestore/security/rules-fields . Supabase sources in the research history explain the discarded proposal and are not implementation instructions.
## 28 November 2026 — binding design and engineering governance

Read [binding project interpretation](directives/BINDING-INTERPRETATION.md) and full master directive, site rulebook and engineering constitution before changes. The interpretation reconciles stricter F3/D2 budgets, approved B+C identity and existing business/transactional rules. Phase 1 repair first, then security, accessibility, performance, SEO/local discovery, privacy/owner, quality, design and evidence. Existing historical sections remain as dated design context; where they conflict with latest approved constraints, follow the interpretation. Main is currently docs-only; development integration and Pages production remain separate. No production promotion or live data changes without owner authorization. Shared matrix [DESIGN-IMPLEMENTATION](qa/DESIGN-IMPLEMENTATION.md) and [HANDOFF](HANDOFF.md) are current evidence/continuity records.

## 28 November 2026 — security controls and release gates (Phase 2)

### Threat model and operational boundaries

| Risk | Control | Residual / gate |
|---|---|---|
| Anonymous/revoked owner or self-grant | Fixed known-document read, active boolean membership, deny list and writes except validated atomic publication; private audit, immutable records, exact schema and revision | Reverify production rules/bootstrap only with explicit approval. Emulator is not production. |
| Duplicate or concurrent updates | Expected revision and operation ID, immutable matching audit, exact same-intent retry; sign-out locks editor | Real owner acceptance and uncertain recovery after reload remain unverified. |
| Wrong project or auth handler | Exact hostname, project pairing, HTTPS or loopback, preview Firebase handler bound to preview project, separate named public/owner apps | Firebase public web API key identifies the project, not authorization. Review restricted API list and authorized domains in approved console; no privileged keys in browser. Actual Google popup/redirect compatibility must be verified. |
| Clickjacking, MIME sniffing, referrer leakage | Pages `public/_headers`: DENY framing, nosniff, no-referrer, disable unused camera/microphone/location/payment/USB | Verify actual Cloudflare response on approved preview. X-Frame-Options applies to this site, not the auth handler iframe. |
| Script injection / XSS | React escapes content, no raw HTML from user inputs; strict candidate CSP in report-only (no unsafe-inline/eval) | Astro inline bootstrap, Firebase/Google endpoints and report events must be reviewed on actual staged configured preview. No remote report collector; local console/event evidence only. Do not enforce CSP until compatible hash-based policy and full browser/auth tests pass. COOP/HSTS deferred pending popup and domain readiness. |
| Cached private or stale data | Admin HTML no-store, public HTML revalidate, immutable content-hashed Astro assets; no authoritative stale price or service worker caching | Cloudflare's actual response/cache behavior UNVERIFIED; do not cache Firebase/auth responses. Hashed assets only under /_astro/. |
| Free-tier quota abuse | Known-document public GET, no listing/polling, deduplicated reads and visibility refresh, no customer accounts | Rules cannot rate-limit a public document; monitor Firestore read/quota and auth anomalies. Consider compatible App Check in later approved work, never enable it blindly or introduce paid service. |
| Supply-chain/secret exposure | Read-only PR runner, pinned action revisions, lockfiles, runtime+full root npm audit and isolated CLI audit, redacted pinned Gitleaks history scan | Scanner is not exhaustive. Rotate suspected exposed credentials through owner-approved console, revoke access, preserve evidence, then fix and retest. No production data/credentials in CI. |

Sources: [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/), [MDN CSP implementation](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/CSP), [Firebase security checklist](https://firebase.google.com/support/guides/security-checklist), [Firebase API keys](https://firebase.google.com/docs/projects/api-keys), [Google auth](https://firebase.google.com/docs/auth/web/google-signin), [redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices). The local Python preview server intentionally models only our exact and trailing-star header patterns, rejects ambiguous duplicate header values, and is not proof of Cloudflare behavior. It is loopback-only. Live verification requires actual preview curl/browser evidence; no invasive production scans. Production domain, live data, rules, HSTS, indexing and launch remain separate approval gates.

## 28 November — customer route payload isolation

The initial measured React client runtime alone exceeded the 60,000-byte gzip customer cap. The existing Astro architecture now pre-renders Counter.astro and loads one native counter controller, using the same validated domain functions; React remains on the authenticated owner route. Old customer React files are retained for review and not used on home. No replacement framework or dependency introduced. Public document reads use public-config.ts + public-read.ts rather than the authenticated SDK, with one fixed GET, no credential/token/cache, exact wire validation, timeout and bounded body. Rules still govern unauthenticated REST (https://firebase.google.com/docs/firestore/use-rest-api); live config is not yet accepted. Admin authentication, SDK transaction, rules and data unchanged. CI measures observed static gzip separately from timing and live transfer. See HANDOFF.md for exact heads and QA evidence; keep 60,000 B hard gate, never reintroduce public hydration/SDK accidentally. Historic architecture descriptions of customer React hydration are superseded by this scoped performance decision.

## 28 November — launch-safe local discovery

The customer route remains static. src/data/shop.ts centralizes supplied public facts, typed unknown street/pin/hours, canonical URLs, original-logo sharing metadata, linked Store/WebSite/WebPage graph and visible FAQ. src/lib/shop/hours.ts is a tested schedule helper, not a claim of real opening hours; runtime opening status remains disabled until verified hours. robots and sitemap are prelaunch candidates; existing HTTP/HTML noindex retained. No map embeds or additional client dependency. See [local discovery and launch checklist](LOCAL-DISCOVERY.md) for evidence, crawler-policy decision, profile and publication gates. No external account edits or SEO ranking claims.

## Phase 6 — owner recovery and privacy boundary

owner-recovery.ts validates a bounded, same-project/same-UID tab recovery envelope for an explicitly submitted operation, fixed two-hour restoration window; no automatic writes, no ordinary draft persistence. OwnerEditor reads it only after server membership and catalogue read, then offers explicit same-intent retry. Firebase transaction/rules and backup format unchanged. Customer clear-basket control in privacy page removes only the saved basket key; storage deletion resets active counter memory and invalidates handoff. See PRIVACY-DATA-MAP.md and OWNER_CONSOLE.md for data lifecycle, risks and release gates.
