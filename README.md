# Robokalam

Literature of Technologies. The rebuild of robokalam.com: one product with three doors (Learner, School, Educator), joined by the Kalam Line.

- **Phase 1 review, plan, tokens, storyboard, claims and open questions:** [docs/PHASE-1.md](docs/PHASE-1.md)
- Stack: Next.js 16, React 19, TypeScript, Tailwind 4, Zod, MySQL/MariaDB (Hostinger), Playwright with axe-core.
- **Database setup:** [docs/DATABASE.md](docs/DATABASE.md)

```bash
npm install
npm run build && npm start
npx playwright test
```

Key places:
- `src/content/claims.ts`: the Claims Register. Nothing numeric renders unless approved there.
- `src/content/site.ts`: doors, worlds, programmes, gigs, FAQs.
- `src/components/motion/`: the Kalam Line, motion runtime and door view transitions.
- `src/app/api/leads`: CRM routing by door. Configure webhooks in `.env` (see `.env.example`).
