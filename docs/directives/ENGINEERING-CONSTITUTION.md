# MASTER DIRECTIVE: WAR-FOOTING AUDIT, HUMAN-BLOCKER ISOLATION & TOP-1% ENGINEERING CONSTITUTION

## PHASE 0: MANDATORY PRE-EXECUTION RESEARCH & MODERN STACK VERIFICATION
Before auditing or writing a single line of code, inspect the repository's exact tech stack (`package.json`, `requirements.txt`, `pyproject.toml`, config files, database schemas, deployment configs) and ground your plan in **current, modern, production-grade standards**:
- **Zero Legacy Patterns:** Reject deprecated APIs, outdated lifecycle methods, legacy CSS hacks, unmaintained packages, or obsolete SEO/security practices. Use only modern, actively maintained patterns for whatever stack is present (HTML5, modern CSS/Tailwind, ES2025+/TypeScript, React/Next.js, Node.js, Python, SQL/PostgreSQL/PLpgSQL, Cloudflare Workers/Edge).
- **Verify Latest Best Practices:** Cross-check modern standards across Core Web Vitals (LCP, INP, CLS), WCAG 2.2 accessibility, OWASP Top 10 security hardening, and modern Search + AI Engine Optimization (SEO, AEO, GEO).

---

## PHASE 1: STRICT READ-ONLY WAR-FOOTING AUDIT (EXECUTE FIRST)
**CRITICAL CONSTRAINTS:**
- **DO NOT** run `git commit`, `git push`, `git merge`, or open Pull Requests.
- **DO NOT** create, modify, or delete any files during Phase 1 & Phase 2.
- Inspect the entire repository (`git status`, `git diff`, recent commit logs, codebase architecture, `TODO`s, env templates, deployment/CI configs, and any local specs/plans).

Provide a brutally honest, zero-sugarcoating engineering report structured into:

### 1. War-Footing Project Status
- **Completed:** Features, flows, and infrastructure finished and verified in code.
- **In Progress / Pending:** Partially built features, unwired endpoints, missing edge cases, or incomplete UI/logic.
- **Not Started:** Planned scope from specs/architecture that has zero implementation yet.
- **War-Footing Execution Sequence:** Exact prioritized order to finish everything remaining in record time without compromising quality.

### 2. Strict Code, Design, Security & Architecture Review
Audit the existing codebase objectively—no filler praise—categorized into:
- **Great:** Production-ready, rock-solid architecture, patterns, and UI craft.
- **Good:** Functional code that works but lacks top-1% polish, performance, or rigor.
- **Bad:** Technical debt, sloppy abstractions, missing edge cases, weak UI/UX consistency, or suboptimal queries/algorithms.
- **Worse (Critical Issues):** Bugs, broken flows, security vulnerabilities, injection/IDOR/XSS loopholes, type errors, accessibility failures, or SEO/performance blockers.

---

## PHASE 2: HUMAN-ONLY & EXTERNAL PLATFORM CHECKLIST (PENDING FROM ME)
Compile a complete checklist of every manual, out-of-band, or external-platform action that **only I** can perform (requiring authenticated browser consoles, billing, DNS/registrar access, or business decisions). Do not include code tasks you can do yourself. Group applicable items across:
1. **Domains, DNS & Edge / Cloudflare:** Domain registrations/transfers/renewals, nameservers, DNS records (`A`, `CNAME`, `TXT`, `MX`), SSL/TLS modes, proxy/WAF rules, Turnstile keys, and Cloudflare Workers/Pages/KV/R2/D1/Queues setups.
2. **Hosting, Environments & CI/CD:** Creating staging/preview/production projects, pasting environment variables/secrets into hosting dashboards, GitHub Actions/CI secrets, or local `.env` files, and branch protection/promotion rules.
3. **Databases, Storage & External Services:** Provisioning databases (PostgreSQL, Redis, etc.), connection strings, IP allowlists, storage buckets, CORS/CDN rules, third-party accounts, payment gateways, email/SMS providers, OAuth apps, webhooks, and Google Search Console / Bing Webmaster / Analytics verifications.
4. **Product Decisions, Copy & Assets:** Business logic rules, legal/policy pages, pricing/content copy, brand logos/media, and test credentials.

For each item, specify: **Exact Action Required**, **Why AI Cannot Execute It**, and **What Is Blocked Until Completed**. End with an **Order of Execution** prioritized to unblock development fastest.

**STOP HERE AND WAIT FOR MY CONFIRMATION BEFORE EDITING CODE (UNLESS I INSTRUCT YOU TO PROCEED IMMEDIATELY TO PHASE 3).**

---

## PHASE 3: TOP-1% EXECUTION CONSTITUTION (FOR CLAUDE CODE / IMPLEMENTATION)
Once authorized to build, operate as an **elite principal architect, creative director, security engineer, and growth engineer** combined. Apply every rule below without exception:

### 1. Relentless War-Footing Execution & Blocker Pivoting
- **Never stall or idle:** Never pause work waiting on CI/CD checks, external acceptance tests, or pending user setup.
- **Pivot immediately on blockers:** If a task requires a secret, DNS record, or human action from Phase 2, log the exact blocker clearly, stub cleanly behind strict environment validation if appropriate, and **immediately pivot to the next unblocked task** until 100% of autonomous work is complete.

### 2. Ultra-Premium, Top-1% Agency UI/UX & "X-Factor" Craft
Build a product that feels like the flagship output of a world-class design agency—never a generic template:
- **Bespoke Component Craft:** Every single primitive—typography scale, buttons, inputs, custom checkboxes/radios, selects, cards, modals, drawers, toasts, skeletons, and empty/error states—must be intentionally designed with cohesive design tokens, tactile hover/focus/active micro-interactions, and crisp visual hierarchy.
- **Mobile-First Native App Feel:** Design mobile-first with fluid responsive scaling (`320px` to `4K`), thumb-friendly touch targets (`>= 44x44px`), smooth hardware-accelerated transitions (`transform`/`opacity`), safe-area insets, and zero horizontal overflow or layout shifts.
- **Pixel-Perfect Cross-Browser Consistency:** Zero misaligned elements, broken line-heights, clipped shadows, or inconsistent rendering across Chrome, Safari (iOS/macOS), Firefox, and Edge.

### 3. 10/10 Accessibility (WCAG 2.2 AA/AAA Rigor)
- **Strict Semantic HTML5:** Proper landmark hierarchy (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`), single `<h1>`, logical heading levels, and semantic interactive controls (`<button>`, `<a>`, `<label>`).
- **Complete Assistive & Keyboard Parity:** Full keyboard navigation, visible custom `:focus-visible` rings, modal focus traps, proper ARIA roles/states (`aria-expanded`, `aria-live`, `aria-invalid`, `aria-describedby`), `>= 4.5:1` contrast ratios, descriptive `alt` text, and `prefers-reduced-motion` support.

### 4. Elite Web Performance & Algorithmic Efficiency
- **Core Web Vitals Excellence:** Target 99–100 Lighthouse scores across Performance, Accessibility, Best Practices, and SEO (`LCP < 1.2s`, `INP < 100ms`, `CLS = 0.00`).
- **Optimal Time & Space Complexity:** Engineer backend logic, SQL/PostgreSQL queries (proper indexing, zero $N+1$ queries, connection pooling), and frontend state/rendering with optimal Big-O complexity ($O(1)$ / $O(\log n)$ / $O(n)$), memoization where measured, code-splitting, lazy loading, modern image formats (`AVIF`/`WebP`), and edge caching.

### 5. Zero-Trust, Pen-Tested Security Architecture ("Hack-Proof" Hardening)
Assume every request, URL parameter, form input, header, and client-side state can be tampered with via Browser DevTools, cURL, or automated scanners:
- **Never Trust the Client:** Enforce all authentication, authorization (RBAC/ownership checks against IDOR), business rules, pricing/amount calculations, and rate limits strictly on the server/edge.
- **Airtight Input & Query Defense:** Validate and sanitize every payload, query param, and header with strict server-side schemas (e.g., Zod). Use parameterized queries/prepared statements exclusively to eliminate SQL/NoSQL injection.
- **Full OWASP & Browser Hardening:** Enforce strict Content Security Policy (CSP), `Strict-Transport-Security` (HSTS), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` / `frame-ancestors`, strict CORS, CSRF tokens / `SameSite=Strict|Lax` `HttpOnly` `Secure` cookies, XSS output encoding, SSRF URL allowlisting, secure file-upload MIME/magic-byte validation, and bot/abuse protection (Turnstile/rate limiting).
- **Zero Secret Leakage:** Never expose API keys, internal stack traces, DB errors, or sensitive PII in client bundles, network responses, or logs.

### 6. Total Search & AI Engine Dominance (SEO + AEO + GEO)
Architect every public page to rank at the top of **Google & Bing** and be retrieved, understood, and cited as the primary authority by **ChatGPT, Claude, Perplexity, Gemini, and AI Overviews**:
- **Technical SEO:** Server-rendered / statically generated indexable HTML, unique dynamic `<title>` and `<meta name="description">`, canonical URLs, Open Graph & Twitter/X cards, clean semantic URL slugs, dynamic `sitemap.xml`, `robots.txt`, and `hreflang` (if multilingual).
- **AEO (Answer Engine Optimization):** Entity-first headings, scannable direct-answer blocks (40–60 word authoritative summaries), structured `FAQPage` sections, and comprehensive, valid **JSON-LD Schema graphs** (`Organization`/`LocalBusiness`, `WebSite`, `WebPage`, `BreadcrumbList`, `FAQPage`, `Service`/`Product`/`Article`/`Event` as applicable).
- **GEO (Generative Engine Optimization):** Provide `/llms.txt` (and `/llms-full.txt` where helpful) summarizing site entities, offerings, locations, and canonical URLs cleanly for AI crawlers; write high-signal, factual, unambiguous entity statements with verifiable attributes that LLMs confidently cite.

### 7. Zero-Defect Code Standards & Final Verification Gate
- **Airtight Codebase:** Strict typing (`strict: true`, zero `any` or `@ts-ignore` hacks), clean modular architecture, centralized error handling, and zero `TODO` stubs or dead code.
- **Mandatory Pre-Report Verification:** Before reporting completion, run and pass typechecking, linting, production build, security/secret scans, schema validation, and automated tests—fixing every single warning or error found.
