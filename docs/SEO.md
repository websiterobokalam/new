# SEO and Google tracking for robokalam.com

No code can promise the number-one spot on Google, but every technical piece is now in place.
What lifts the ranking from here is mostly outside the code: Google Business Profile, reviews,
links from schools and partners, and a steady stream of useful blog posts. This page lists both.

## What the site already does

| Area | Where |
| --- | --- |
| A title, description, canonical and Open Graph image on every public page | `generateMetadata` per route, defaults in `src/app/layout.tsx` |
| `sitemap.xml` covering content pages, programmes, cities, blog posts, upcoming events and live courses | `src/app/sitemap.ts` |
| `robots.txt` that keeps `/api`, `/app`, `/login` and `/internal` out of search | `src/app/robots.ts` |
| Structured data: Organization + EducationalOrganization, WebSite, FAQPage, BreadcrumbList, Course, BlogPosting, Event, and LocalBusiness for each city | `src/lib/jsonld.tsx` |
| `/llms.txt`, a plain summary that AI assistants and answer engines can read | `src/app/llms.txt/route.ts` |
| Local pages for Hyderabad and Warangal, with areas served, FAQs and office details | `src/content/cities.ts` |
| Fast pages: three.js and the 3D effects stay out of the first-load JavaScript, and images are WebP with `srcset` | performance budget in the tests |
| Google Analytics 4, used only with consent | `src/components/Analytics.tsx` |
| Search Console and Bing verification tags | `metadata.verification` in `layout.tsx` |
| An automated audit of every sitemap URL: status 200, indexable, one h1, unique title (15–70 characters) and description (50–170), self canonical, og:image, alt text on every image | `tests/e2e/seo.spec.ts` |

## Steps for you (about an hour)

### 1. Google Analytics 4
1. Go to analytics.google.com, then Admin, then Create property. Name it "robokalam.com", set the time zone to India and the currency to INR.
2. Add a Web data stream for `https://robokalam.com` and copy the Measurement ID (`G-XXXXXXXXXX`).
3. On Hostinger, set `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` and click Redeploy (this setting needs a rebuild).
4. In GA4, go to Admin, then Data collection, and leave **Google signals off**. Under Data retention, choose 2 months.
5. Under Admin, then Events, mark these as key events (conversions): `generate_lead` (school, educator and learner forms, and contact), `sign_up` (newsletter) and `event_register`.

Visitors see a small "Allow analytics / No thanks" notice. Nothing loads until they allow it. Analytics never runs on signed-in pages, sign-in pages, children's booking and application pages or certificates, and advertising features stay off. The privacy notice (Cookies section) says the same. Keep it that way, because the DPDP Act treats children's data strictly.

### 2. Google Search Console
1. Go to search.google.com/search-console and add a property.
   - **Domain property (best):** add the TXT record it gives you in Hostinger's DNS zone editor.
   - **Or URL prefix:** use `https://robokalam.com`, choose "HTML tag", copy only the `content="…"` value into `NEXT_PUBLIC_GSC_VERIFICATION`, then Redeploy.
2. Go to Sitemaps and submit `https://robokalam.com/sitemap.xml`.
3. In URL inspection, request indexing for `/`, `/learn`, `/21c-lab`, `/locations/hyderabad`, `/locations/warangal` and `/blog`.
4. Link Search Console to GA4 (GA4 Admin, then Product links).

### 3. Bing Webmaster Tools (also feeds ChatGPT search and Copilot)
Go to bing.com/webmasters and import from Search Console in one click. If you'd rather use the meta tag, put its value in `NEXT_PUBLIC_BING_VERIFICATION` and Redeploy. Then submit the sitemap.

### 4. Google Business Profile (the biggest lever for "near me" searches)
- Create or claim one profile each for **Robokalam, T-Hub Hyderabad** and **Robokalam Warangal**.
- Use the same name, address and phone as the site (`src/content/company.ts`). They must match exactly.
- Category: "Educational institution", with extra categories "Robotics course", "Computer training school" and "STEM school".
- Website: `https://robokalam.com/locations/hyderabad` (or `/warangal`).
- Add real photos of the lab and events (adults only, or with parents' written consent).
- Ask every happy parent and school for a Google review, and reply to every one.

### 5. Links and mentions
- Ask partner schools to link to `robokalam.com/21c-lab` from their "facilities" page.
- Ask for a link from T-Hub, TGIC and any government or university programme you work with.
- Listings: JustDial, Sulekha, UrbanPro, LinkedIn company page, YouTube channel description. Use the same name, address and phone everywhere.

## Keywords to target

| Intent | Keywords | Page |
| --- | --- | --- |
| Parents, local | robotics classes for kids Hyderabad, coding classes for kids Warangal, robotics classes near me, STEM classes Hitec City | `/locations/*`, `/learn` |
| Parents, programme | robotics course for 7 year old, Arduino for kids, AI course for school students, summer camp robotics Hyderabad | `/programs/*`, `/courses` |
| Schools | robotics lab for schools, Atal Tinkering Lab setup Telangana, STEM lab for schools India, AI lab for schools | `/21c-lab`, `/21c-lab/planner` |
| Educators and students | robotics trainer jobs Hyderabad, STEM educator jobs, campus ambassador program | `/kalamites`, `/campus-ambassadors` |
| Brand | Robokalam, Robokalam Technologies, Robokalam T-Hub | home, `/about` |

## Content plan (two posts a month)

Write in `src/content/blog.ts`. Each post needs a clear title with the keyword in it, a description of 120–160 characters, an answer to the question in the first paragraph, one real photo, and links to the matching programme and city page.

1. What age should a child start robotics? (A guide for Hyderabad parents.)
2. Atal Tinkering Lab vs a full 21st Century Lab: what schools in Telangana should know.
3. Five robotics projects kids can build at home with an Arduino kit.
4. Coding for kids in Warangal: blocks, Python and what comes next.
5. How a school robotics lab improves science results (with your own school data, once it's approved in the Claims Register).
6. Summer camp 2027: robotics, IoT and VR in Hyderabad (publish by March).
7. AI for school students: what is safe, what is useful.
8. A day in the life of a Kalamite educator.

## Checks before each release

```bash
npx playwright test tests/e2e/seo.spec.ts --project=desktop
```

Also check the pages' structured data with Google's Rich Results Test, and run PageSpeed Insights on `/` and `/learn`. Aim for green Core Web Vitals on mobile.
