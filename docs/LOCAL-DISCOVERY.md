# Local discovery and release checklist

Date: 28 November 2026. Phase 5. Canonical host is https://moinmuttonmart.in; no DNS change or indexing authorization is implied.

## Public facts and pending facts

| Field | State / treatment |
|---|---|
| Name, neighbourhood, city, region, country | Moin Mutton Mart; Mallepally, Hyderabad, Telangana, India. Confirmed public locality from architecture; visible and schema consistent. |
| Primary contact | +91 81437 30054; same recipient as WhatsApp request module. |
| Instagram | Owner-supplied URL in architecture; linked visibly and in sameAs. Profile ownership not independently verified. |
| Exact address, postal code, pin, GBP | [NEEDS CLIENT INPUT] Verify precise spelling and shared Google Business Profile/Maps URL. No guessed street or coordinates. Locality map search only. |
| Opening hours and holidays | [NEEDS CLIENT INPUT] Real weekly intervals and dated exceptions, timezone Asia/Kolkata; unknown, call to confirm. Synthetic hours tests are not real business hours. |
| Delivery, pickup, charging basis, cut choices, prices, photos | [NEEDS CLIENT INPUT] Use previously supplied facts when available, confirm unresolved items. No fake details. |
| Reviews and claims | No rating, review, certification, hygiene/sourcing/halal/licence claims unless substantiated and approved. |

## Engineering and launch gate

- Typed public facts in src/data/shop.ts; one known business graph on home, linked stable IDs, canonical URLs on public home and privacy, no schema on private admin. Partial address is intentional: complete Google's required physical address before rich-result eligibility assessment; no external validator result yet. No Offer schema until visible real price, currency and availability are verified.
- Static markup works without JavaScript. Readable FAQ and phone/map/social contacts below product range; no embedded map/network overhead. Use supplied logo as social preview, not fake storefront photo. Canonical social image URL targets approved domain; validate actual URL and WhatsApp/social unfurl only after launch routing. Preserve original logo file and optimized browser variants.
- robots.txt intentionally allows crawl so search bots can read noindex; all preview HTML and static response headers remain noindex,nofollow. robots.txt is not access control. Admin auth remains enforced by Rules. Sitemap XML is a staged canonical candidate, home only, no admin/preview URLs, no fabricated lastmod; not advertised or submitted. Privacy remains noindex under current policy. Future release must isolate production metadata and HTTP headers from all preview builds and keep admin noindex/no-store. Do not simply remove wildcard noindex on every deployment.
- Once authorized: verify owner GBP and exact NAP, category/service choices, hours and special hours, photos, real review link, WhatsApp Business catalogue and approved delivery facts; match all site/social/local profile fields. Real review requests may be honest and ungated, never incentivized or fabricated. No external account changes performed.
- Validate schema with Schema Markup Validator and Google Rich Results Test on approved public content; distinguish parse/shape CI from external eligibility. Confirm canonical host/redirects and 200/404, noindex on previews/admin, correct robots/sitemap on only approved canonical production, actual headers, then Search Console and Bing ownership/sitemap; IndexNow only after verified launch and approved keys. No hreflang until approved languages and native review. No ranking promise.
- Crawler policy: wildcard allow preserves prior implicit behavior. Search/assistant retrieval and training controls are distinct. Owner's training-crawler choice remains open; do not silently set a different policy. Before launch, recheck current official token names and document explicit decisions for search, user-requested retrieval and training (Googlebot/Bingbot, OAI-SearchBot/ChatGPT-User/GPTBot, Claude-SearchBot/Claude-User/ClaudeBot, PerplexityBot, Google-Extended, CCBot as applicable). No blanket block preventing noindex from being seen. No llms.txt experiment: optional and unproven, not needed for Google AI visibility. Reconsider only if a real use case arises.
- Publish only when existing Part E evidence and owner launch approval are satisfied. No GBP verification, external submissions, production write, domain cutover, actual WhatsApp send or paid service during Phase 5.

## Research

Current official sources reviewed 28 November 2026:
- Google LocalBusiness: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Canonicals: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Noindex: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- AI features and website: https://developers.google.com/search/docs/appearance/ai-features ; https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- GBP representation: https://support.google.com/business/answer/3038177 ; verification https://support.google.com/business/answer/7107242 ; special hours https://support.google.com/business/answer/6303076
- Google crawler tokens: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- OpenAI crawler settings: https://developers.openai.com/api/docs/bots

Evidence: see docs/HANDOFF.md and docs/qa/DESIGN-IMPLEMENTATION.md. Existing noindex deliberately prevents search launch; ordinary crawlability, visible facts and metadata are foundations only, not current ranking or indexing.
