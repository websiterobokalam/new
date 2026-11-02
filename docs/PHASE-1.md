# Robokalam rebuild: Phase 1 review

Status: Phase 1 (Foundation) built and tested. Stopped for review, as the brief asks.

## 0. What I could and could not read

The build environment's network policy blocked every source site: old.robokalam.com, robokalam.com, learn.robokalam.com, shop.robokalam.com, validate.robokalam.com, oll.co and chitti.app. Nothing in this build comes from those sites. Every fact on the site comes from the brief itself. Every number goes through the Claims Register and stays hidden until approved.

To fix this, add those hosts under **Allowed domains** in the cloud environment's network settings, or paste the page content. I will then do a source pass: copy, old URLs for the redirect map, imagery cues and the Studio services list.

## 1. One-page plan

| | |
|---|---|
| **Goal** | One product with four layers: marketing site, focused landing pages, a logged-in PWA, and the Kalam Fellows marketplace. |
| **Core idea** | Three equal doors (Learner, School, Educator), joined by the Kalam Line: pen stroke → circuit trace → signature. |
| **Phase 1 scope** | Design system, motion system, homepage, three door pages, three login screens, CMS-shaped content layer, Claims Register, Try the Bot, Lab Planner, Fellow waitlist, CRM routing, redirects. |
| **Stack** | Next.js 16.4 (App Router, static generation, Turbopack), React 19.3, TypeScript 5.9, Tailwind 4.3, Zod 4, Playwright 1.64 with axe-core. |
| **Hard rules in code** | Unapproved claims never reach the HTML. No contact without opt-in. Age band only for children. Fellows must confirm 18+. Production refuses a lead rather than lose it silently if no CRM webhook is set. |
| **Quality** | 64 automated tests pass: logic, end-to-end on mobile and desktop, and WCAG 2.2 AA axe checks in light and dark. First-load JS is 141–154 KB gzipped, against a 170 KB budget. Lab LCP is 0.6–0.8s with CLS 0 at 4× CPU throttle and 4G. |

### Decisions I made (labelled, easy to change)
1. **TypeScript 5.9, not 7.0.** TS 7 (the native port) is the newest release, but Next's type plugin and tooling are only verified on 5.x.
2. **A custom motion runtime (~2 KB), not GSAP.** It does the same job with native SVG `getTotalLength`/`getPointAtLength`, stroke-dashoffset, IntersectionObserver and the View Transitions API, which keeps us inside the 170 KB budget. GSAP can be lazy-loaded later for richer hero scenes.
3. **CMS: a typed content layer for now** (`src/content/*.ts`, Zod-validated). Its shapes match CMS collections (claims, pages, programmes, FAQs, stories) so a headless CMS can take over without touching components. **CMS vendor is an open question.**
4. **Hosting assumption:** a Node server on an India region (for example Vercel `bom1`, or AWS/GCP Mumbai). Lead API and OTP need a server, so this is not a static export.
5. **Rate limiting is in-memory** for one server instance. Move it to Redis before scaling out.
6. **Placeholder logo** (a pen nib whose slit becomes a circuit trace) until the official logo files arrive.
7. **Original isometric SVG lab** stands in for the 3D lab render. It is generated from code, so it is crisp and costs no image request.

## 2. Site map

✅ built in Phase 1 · ◐ honest placeholder page (noindex) · ⏳ later phase

```
/                         ✅ Home (14 sections)
/learn                    ✅ Learner door + Free Build Session request
/courses, /courses/[slug] ◐  Phase 2 marketplace
/programs                 ◐  /programs/[slug] ◐ (6 Ashaer tracks, honest stubs)
/bootcamps /internships /kits ◐
/21c-lab                  ✅ School door + 4-step demo booking
/21c-lab/planner          ✅ Lab Planner (4 steps → plan → PDF / send to team)
/fellows                  ✅ Educator door
/fellows/apply            ✅ Fellow waitlist
/fellows/earnings         ✅ How pay works + calculator
/fellows/safety           ✅ Rules for teaching children
/login, /login/{learner,school,educator} ✅ (OTP UI; sending is off until Phase 2)
/stories /impact /events /partners /studio /about /careers /faq /contact /validate ◐
/privacy /terms /refunds /child-safety /fellow-terms ◐ (counsel to draft)
/app                      ◐ PWA start URL (manifest is live)
/internal/claims          ✅ Claims Register view (noindex; moves behind ops login)
```
Region picker (TS·AP / Rest of India / International) is in the header and saved in a cookie. Language switching ships in Phase 2.
Redirects: `/forschools.html → /21c-lab` (301) is confirmed. Eleven more common patterns are in `src/content/redirects.ts`, marked `verified: false` until the old site is crawled.

## 3. Design tokens (`src/app/globals.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| navy | #0A4060 | — | headings, primary buttons (white text 10.6:1) |
| ink / fg | #0B2B3D | #E3EFF5 | body text |
| sky / aqua / leaf | #0098D6 / #00CBD6 / #98B844 | same | Kalam Line, glows, borders. **Never body text.** |
| bg | #F6FBFD (Cloud) | #070B14 (Night) | page |
| panel / panel-2 | #E6F4FA (Mist) / #F0F6E3 (Leaf Mist) | #0F1D2E / #121F1A | panels |
| muted | #3D5A6C (7.0:1) | #A3BCCB | secondary text |
| link | #075A80 (7.2:1) | #6FD7F0 | links on light |
| btn / btn-fg | navy / white | #E6F4FA / navy | primary button |
| spark | #FFD31D | — | tiny highlights only |
| gradient | sky → aqua → leaf | same | `--kalam-gradient` |

Type: Bricolage Grotesque (display), Instrument Sans (body), JetBrains Mono (data and code), Anek Telugu and Anek Devanagari (load only when those glyphs appear). Radius 1.5rem cards, pill buttons, soft navy-tinted shadows.

## 4. Homepage wireframe (as built)

```
┌ Header: logo · Learn Schools Fellows | Partners Studio · Region · Theme · Login ┐
│ HERO  pen writes "Robokalam" → H1 "Pick your door. Start building."   [3D lab ] │
│       positioning line                                    (rotating badge)      │
│        ╭──────────── line splits in three ────────────╮                         │
│  [LEARNER robot]      [SCHOOL lab]       [EDUCATOR earnings]  ← preview on hover │
│  Book a Free Build    Book Turnkey Demo  Become a Fellow                         │
│ ▭ glass trust bar (approved proof + our commitments)                            │
●─ TRY THE BOT  maze ▸ blocks ▸ live Python   (lazy-loaded, nothing stored)       │
●─ FIVE WORLDS bento: Robotics(big) IoT AI / FinLit Space Coding (line motifs)    │
●─ LEARNER LADDER age 6 → college, rising line                                   │
●─ LAB AT NIGHT (dark) benches light up · Survey → Install → Train → Power on     │
●─ KALAM FELLOWS band: big headline · swipeable gig cards · Become a Fellow  (bot waves) │
●─ IMPACT band sky→aqua: approved stats, else "real numbers only" statement       │
│  [Made by students: hidden until consented content]                              │
●─ PARENT TRUST 6 cards                                                           │
│  [Project stories + Student voices: hidden until approved/consented]            │
│  FAQ (FAQPage JSON-LD)                                                           │
●─ THE THREE DOORS AGAIN                                                          │
└ Footer (Night): line signs "Robokalam" · 5 link columns · legal name ┘
```

## 5. Kalam Line storyboard

| # | Moment | Built how | Reduced motion / no JS |
|---|---|---|---|
| 1 | Page load: the pen writes "Robokalam", then the line runs down | SVG text, stroke-dashoffset, then fill | Fully drawn text |
| 2 | Line splits into three branches. Hover or focus on a door lights its branch and opens its preview | CSS `:has()`; previews: robot drives, lab screens light, earnings card expands | Static branches |
| 3 | Scroll draws one continuous path through every section | `KalamLine`: path built from `<LineNode>` positions; length→y lookup; rAF-throttled | Static fully drawn line |
| 4 | Arrival: node lights, section powers on with a soft rise | IntersectionObserver sets `data-on`; CSS stagger | Content always visible |
| 5 | Line changes shape per world: circuit, pulse, neural net, growth curve, orbit, code | Per-card SVG motifs, drawn on power-on | Drawn |
| 6 | Kalam Bot rides the line tip and waves at the Fellows band | Absolutely positioned SVG at `getPointAtLength` | Hidden |
| 7 | Tapped door expands into the next page's hero | View Transitions API (`door-hero`), router waits for the new pathname | Normal navigation |
| 8 | Footer: the line signs the name | Stroke then fill on the footer power-on | Drawn |

Phones: the line runs down the left edge. Content gets a 36px left gutter. No section is pinned. Scrolling is never trapped, and buttons are never delayed beyond 0.3s.

## 6. Claims needing approval

All are in `src/content/claims.ts`. The live view is at `/internal/claims`. **None is approved, so none renders.**

| ID | Public text if approved | Needed |
|---|---|---|
| lab.rollout | 20-day rollout | start event definition, evidence, owner, date |
| lab.instructor | Resident certified instructor | which packages, who certifies |
| lab.roadmap | 12-year roadmap | curriculum document |
| lab.hardware-sla | 72-hour hardware replacement | clock vs business hours, on-time rate |
| curriculum.nep-cbse | Mapped to NEP 2020 and CBSE | mapping document |
| curriculum.cbse-ct-ai | Mapped to CBSE CT and AI, Classes 3–8 | verification |
| initiative.tita | Telangana Early Coders, with TITA | written OK to name TITA, dates, reach |
| initiative.code-week | Ashaers Code Week | editions, dates, participation |
| initiative.code-to-change | Code to Change Jr. | description, outcomes |
| initiative.t-hub | Igniting Innovation, at T-Hub | permission to name T-Hub, year |
| impact.schools / labs / learners / teachers / projects / states | big numbers | **values unknown**, definitions, as-of dates |
| fellows.hours-cap | 15 hours a week during term | confirm |
| fellows.own-course-share | You keep 70% of fees | confirm gross vs net |
| safety.recording-retention | Kept for 30 days | confirm |
| retired.soc2, retired.no1 | never render | — |

Copy marked `draft: true` in `src/content/site.ts` (the programme outcome lines) also needs a curriculum owner. The old "enable Smarty to offer" template copy was not reused.

## 7. Open questions

**Blocking for Phase 2**
1. **CMS vendor:** Sanity, Payload (self-hosted, Postgres) or Strapi? I recommend Payload: it runs in the same Next app on our Postgres in India.
2. **Hosting region and account:** Vercel `bom1`, or AWS/GCP Mumbai?
3. **CRM:** which system receives leads (Zoho, LeadSquared, HubSpot, sheet)? I need a webhook URL per door.
4. **Your inputs list:** approved stats, prices, package names, Fellow eligibility and rate card, refund policy, assets folder, partner logos, Safeguarding Lead and grievance contact.

**Non-blocking (sensible defaults in place)**
5. The Lab Planner rules of thumb (4 learners per bench, 25 sq ft per learner, 36 lab periods a week) need sign-off from the schools team.
6. Old-site URL list for the redirect map.
7. Network access to the source sites, or pasted content, for the copy pass.
8. Official logo files.

## 8. Phase 1 checklist

- [x] Design tokens, light and dark, OS preference plus toggle with no flash
- [x] Motion system: pen write, branching doors, scroll-drawn line, node power-on, world shapes, Kalam Bot, view transitions, footer signature, magnetic buttons, tilt, cursor glow, off-screen pause, reduced motion
- [x] Homepage, all 14 sections (3 hidden in production until content is approved or consented)
- [x] Door pages: /learn, /21c-lab, /fellows (+ apply, earnings, safety)
- [x] Login: /login and three door logins (OTP validation and rate limit live; sending is off)
- [x] Claims Register with publish gate and internal view
- [x] Try the Bot (no login, no data)
- [x] Lab Planner with plan, assumptions, PDF via print, and send to team
- [x] Fellow waitlist (18+ gate, college field, no institute logos)
- [x] CRM routing by door (`/api/leads`, Zod, honeypot, rate limit, masked logs)
- [x] 301 redirects (1 verified, 11 to verify)
- [x] JSON-LD Organization + FAQPage, sitemap, robots, manifest, per-page titles
- [x] Loading, empty, error and not-found states
- [x] 64 tests passing; axe WCAG 2.2 AA clean in both themes
- [ ] Real CMS wired (needs vendor decision)
- [ ] Real assets (needs folder)
- [ ] Source-site copy pass (needs network access)

## 9. Run it

```bash
npm install
npm run build && npm start              # http://localhost:3000
NEXT_PUBLIC_REVIEW_MODE=1 npm run build # review build shows "awaiting content" panels
npx playwright test                     # needs a build first
```
