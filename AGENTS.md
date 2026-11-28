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
## Mandatory permanent directives (28 November 2026)

Before every session read [the complete 19-section Master Design & Engineering Directive](docs/directives/MASTER-DESIGN-ENGINEERING-DIRECTIVE.md), [binding project interpretation](docs/directives/BINDING-INTERPRETATION.md), [Moin site rulebook](docs/directives/MOIN-SITE-DIRECTIVE.md), [engineering constitution](docs/directives/ENGINEERING-CONSTITUTION.md), [live requirement matrix](docs/qa/DESIGN-IMPLEMENTATION.md), [audit](docs/qa/AUDIT-0.md), [phased plan](docs/qa/IMPLEMENTATION-PLAN-1.md) and [handoff](docs/HANDOFF.md). Pull main first; inspect all refs/worktree and use only an isolated phase branch. Preserve stricter constraints, phase approvals, and production gates. The source docs are binding, not optional suggestions. Use [master execution prompt](docs/directives/MASTER-EXECUTION-PROMPT.md) to resume. Update matrix and append handoff at every phase boundary; never silently amend a directive.
