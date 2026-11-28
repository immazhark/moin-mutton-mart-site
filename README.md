# Moin Mutton Mart

Mobile-first catalogue and WhatsApp requests for Mallepally, Hyderabad.

Domain: https://moinmuttonmart.in (Spaceship; launch pending).

Read [architecture](docs/ARCHITECTURE.md), [implementation plan](docs/IMPLEMENTATION_PLAN.md), [working rules](AGENTS.md) and [status](docs/IMPLEMENTATION_STATUS.md).

Stack: Astro, TypeScript, React islands, custom CSS, Cloudflare Pages, Firebase Spark Google Auth and Firestore. Free tiers only, no linked billing or paid subscriptions.

B + C hybrid storefront preview implemented with Astro/React. Original logo imported; original demo archived under reference/demo (not deployed). Rates/availability remain enquiry-only. Live Firebase administration and launch are pending. See docs/IMPLEMENTATION_STATUS.md.

Development: npm ci, npm run dev. Verification: npm test, npm run check, npm run build. Browser journeys: npx playwright install chromium, then npm run test:e2e (uses Python 3 to serve the built dist directory). Real photos, rates, quantity/charging units, delivery rules, hours, map pin and admin identity require owner confirmation.

Do not commit commercial agreements, private identities, credentials or customer information. No open-source licence granted.

Before work, read the [binding directives](docs/directives/BINDING-INTERPRETATION.md), [master prompt](docs/directives/MASTER-EXECUTION-PROMPT.md) and [handoff](docs/HANDOFF.md). The latest verification status is in [living matrix](docs/qa/DESIGN-IMPLEMENTATION.md).
