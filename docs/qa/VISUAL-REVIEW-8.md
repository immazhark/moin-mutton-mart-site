# Phase 8 visual evidence and critique

28 November 2026. Approved B+C direction remains binding. Independent shop identity: Moin's real neighbourhood meat counter, not a luxury landing page or fictional food brand. Original logo and confirmed locality retained; genuine product photos not supplied. The store is a working enquiry utility, not a payment checkout. No design reference assets copied.

## Render iterations

- Baseline d3280ca: https://36bb5e50.moin-mutton-mart-site.pages.dev — actual 390×844 and 1280×844 screenshots; redundant placeholder tiles, generic grid, orphan weight units.
- a6980b: https://f35af91c.moin-mutton-mart-site.pages.dev — 390/1280 actual screenshots; tighter cards, hierarchy, explicit ready state. 360px density test failed, 41 remaining Chromium tests passed.
- c3c88d3: https://710e6a2c.moin-mutton-mart-site.pages.dev — actual 360/390/768/1280/1920 screenshots; real category sections, wide odd item, improved scan; 360 header wraps. 42 Chromium tests green.
- f0547f0: https://5cf10402.moin-mutton-mart-site.pages.dev — actual screenshot pixels inspected 320/360/390/430/768/1280/1920, header compact at 360, no clipped weight labels or fake pictures, 390 categories single row, 320 wrap. 43 Chromium tests green including 11-width representative target geometry, 200% reflow at 320 and 390, keyboard/forced colors/no-JS; targeted Firefox/WebKit journeys green. Last follow-up updates precise instruction copy and category padding, logs synthetic ready-state screenshot and tests reduced motion / native guide. Verify exact final head and screenshot in PR before integrating.

## Ten weakest details addressed

| Before | Change | Evidence / residual |
|---|---|---|
| 13 large repeated Photo to come blocks | Removed empty panels, text-first display | actual before/after render; real assets still due |
| Uniform cards and repeated category tags | Three semantic merchandise sections, 3/4 desktop columns, wide odd mobile item | visible sections; filter/search hides empty groups |
| Weak display typography | Heritage Georgia heading, system sans controls, consistent optical spacing | actual render; system face deliberate zero-byte interim choice, independent custom display subset only if justified |
| Weight wraps on g | Nonbreaking unit span, tabular output | screenshot and regression |
| Call wraps into extra header row at 360 | Flexible brand, smaller padding, 44px contact | final screenshot and header height regression |
| Categories waste space | Short visible Speciality label, same accessible name; wrap when necessary | 390 screenshot, all 11 width regressions |
| Generic repeated status dominates names | Global availability note, suppress only generic duplicate when unknown, preserve all actual restrictions | configured browser sold-out/blocked/freshness tests |
| Tall mobile cards | Container-query horizontal rows when width earns it, stacked for large text | 360 screenshot, first three headings within viewport; 390 enlarged text regression |
| Weak selection and review handoff feedback | Green selected state, tactile CSS icon press, clear ready-to-enquire status resets on edit/expiry | state test, configured replay; no auto-send |
| Generic boxed auxiliary sections | Divided contact/FAQ, native quantity disclosure, explicit review-before-send copy | source and no-JS guide test; final interactive render check |

## Research applied, not copied

Impeccable craft floor (https://github.com/pbakaus/impeccable/blob/main/skill/reference/craft-floor.md) and Taste Skill (https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md) — use scope-sensitive visual craft, hierarchy, real states, avoid identical icon-heading cards, gradient/glass effects, synthetic claims; no executable skills installed. Taste's landing-page heuristics do not override established shopping UX. System Georgia interim intentionally prioritizes strict budget; avoid declaring it bespoke typography. Baymard (https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/product-list and https://baymard.com/audits/online-grocery) — compact enough to compare yet sufficient unit/rate/availability information, direct quantity adjustment. Provenance Village Butcher (https://provenancebutcher.com/collections/all) — category and quick selection principle. Behance (https://www.behance.net/gallery/33917770/Blind-Butcher and https://www.behance.net/gallery/100344551/All-Good-Meat-Branding and https://www.behance.net/gallery/244425303/El-Estribo-Brand-Identity-for-a-Premium-Meat-Company) — traditional retail typography/heritage plus clarity, not copied identity. Siteinspire Gene's Sausage Shop listing (https://www.siteinspire.com/website/2234-genes-sausage-shop-and-delicatessen), Land-book food/drink index (https://land-book.com/design/website/food-and-drinks), CSS Design Awards Ecavo listing (https://www.cssdesignawards.com/sites/ecavo/49144/), Mobbin cart/quantity example (https://mobbin.com/explore/screens/827e03da-dd0f-488d-aeea-2872cb6013f0), Refero catalogue index (https://refero.design/screens/a68c55ca-942f-40d9-b587-434cadaf2842), Typewolf food typography (https://www.typewolf.com/blog/favorite-sites-of-february-2017), Codrops motion reduction (https://tympanus.net/codrops/2026/10/26/animating-agents-gsap-animaxxing/) and MDN reduced motion (https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion) — review retrieved public text/index/examples, not all original screenshots or full studies. Awwwards food collection timed out; Page Flows returned 403. Full reference-gallery visual inspection is incomplete; no paid subscriptions or fabricated research. Principle transferred: purpose-first immediate content, selected state, native sheet, clear review, no stock or price fiction. Avoid landing-page theatre: no GSAP, shaders, full-screen reveal, speculative corner shapes, heavy image assets or new client library. Exactly three micro-delights scoped to tasks (tactile stepper, ready state, native guide reveal); global reduced-motion and forced colors respected.

## Honest B3 critique (provisional reviewer judgment; not instrumented score)

| Category | Current evidence | Provisional finding / fix list |
|---|---|---|
| Design and craft (30%) | Seven actual viewport renders, before/after iterations | 8/10: cleaner and intentional, but still text-first without real photography; 320 header wraps appropriately, tighter balance/typography after actual assets |
| Usability and clarity (25%) | direct add, filters, 11 viewport geometries, 200% text, three browser engines, real emulator journeys | 8/10: smooth mechanics, first three items visible at 360; real first-time under-15s task and physical device/assistive tech not measured |
| Creativity and memorability (20%) | own gold mark, counter hierarchy, purposeful three micro-interactions | 6/10: recognisable shop utility, not yet a distinctive shareable hero; genuine shop imagery and brand assets needed |
| Performance and robustness (15%) | configured JS 10,644 B and static 22,109 B at f0547f0, regression/SDK/cross-browser passes | 8/10 provisional engineering review; real slow network, CWV, Lighthouse, live configuration still unverified |
| Content and trust (10%) | factual locality, explicit enquiry, no false photo/price/claims | 7/10: honest but missing verified rates, charging basis, hours, street/pin, delivery, real photos/reviews |

These are subjective scoped critique values only, not test results or release acceptance; weighted B3 provisional 7.5/10. No full Master §15 95/100 score assigned without evidence across all dimensions. Gate not met. Remaining low-score fixes: approved real photo-led compact signature (<90 KB LCP image) + verified hours/rates/quantity facts, genuine unique display typography only if measured and licensed, complete actual task timing and assistive tech, real low-end Android/physical iOS and CWV/Lighthouse/axe, live owner and release checklist. Preserve honest text-first fallback meanwhile. Do not turn an external input block into an invented fact or fake award score.
