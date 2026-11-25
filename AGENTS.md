# Working rules

Read README.md, docs/ARCHITECTURE.md, docs/IMPLEMENTATION_PLAN.md and docs/IMPLEMENTATION_STATUS.md before changes.

- Free tiers only; never link billing or enable paid services/trials.
- Mobile-first app-like catalogue; retain logo; use selected visual direction before product UI implementation.
- Astro/TypeScript, React islands, custom CSS, Cloudflare Pages and Firebase Spark. No Supabase.
- Do not invent rates, units, delivery promises, reviews, opening hours or certifications.
- Firestore Rules enforce membership, input validation, atomic audit publication and conflict handling; test them in emulator.
- Never expose privileged credentials or private identities. No production writes in previews.
- WhatsApp compose is not confirmed sending/order acceptance. Recheck prices/availability and fall back to unpriced enquiry.
- Inspect branches/PRs before editing; one writer per area; use implementation branches. Preserve others' changes; no force push.
- Verify relevant domain, permission and mobile journeys. Essential failing checks block integration; continue unrelated work while CI runs.
- Keep status concise and truthful. Record blockers and next task.
