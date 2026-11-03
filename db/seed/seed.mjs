/**
 * Seeds for MySQL/MariaDB, written in JS so dates are computed once, in UTC.
 * base: every environment. sample: development and review builds only.
 */
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const IST = 5.5 * 3600_000;
/** A time on day +d at hour h, India time, as a UTC Date. */
export function istAt(d, h, m = 0) {
  const nowIst = new Date(Date.now() + IST);
  const day = Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate() + d, h, m);
  return new Date(day - IST);
}

const PROJECTS = [
  ["robotics-1-light", "robotics", 1, "First light", "A circuit that switches an LED on and off", [], 6],
  ["robotics-1-buzz", "robotics", 1, "Buzz alarm", "A buzzer alarm with a push button", ["robotics-1-light"], 6],
  ["robotics-2-rover", "robotics", 2, "Rover", "A two-wheel rover you drive with code", ["robotics-1-buzz", "coding-1-blocks"], 7],
  ["robotics-2-line", "robotics", 2, "Line follower", "A rover that follows a black line", ["robotics-2-rover"], 8],
  ["robotics-3-arm", "robotics", 3, "Pick-and-place arm", "A servo arm that sorts blocks", ["robotics-2-line", "coding-2-python"], 9],
  ["coding-1-blocks", "coding", 1, "Block maze", "A block program that solves a maze", [], 6],
  ["coding-2-python", "coding", 2, "Python turtle", "Drawings made with Python loops", ["coding-1-blocks"], 8],
  ["iot-1-weather", "iot", 1, "Weather station", "A sensor that logs temperature and humidity", ["robotics-1-light", "coding-1-blocks"], 9],
  ["iot-2-plant", "iot", 2, "Smart plant", "A pot that texts you when it needs water", ["iot-1-weather", "coding-2-python"], 10],
  ["ai-1-sorter", "ai", 1, "Image sorter", "A model you train to tell two objects apart", ["coding-2-python"], 10],
  ["ai-2-voice", "ai", 2, "Voice command robot", "A rover that obeys spoken words", ["ai-1-sorter", "robotics-2-rover"], 11],
  ["finlit-1-budget", "finlit", 1, "Pocket money plan", "A savings plan with a goal chart", [], 8],
  ["finlit-2-stall", "finlit", 2, "Market stall", "A tiny business plan with costs and price", ["finlit-1-budget"], 10],
  ["space-1-orbit", "space", 1, "Orbit model", "A working model of planets in orbit", [], 7],
  ["space-2-sat", "space", 2, "Paper satellite", "A satellite model with a sensor payload", ["space-1-orbit", "iot-1-weather"], 10],
];

export async function seedBase(c, root) {
  // Consent notices: the hash pins the exact text a guardian agreed to.
  const notices = JSON.parse(readFileSync(`${root}/db/seed/notice-learner.json`, "utf8"));
  for (const lang of ["en", "te", "hi"]) {
    const n = notices[lang];
    const body = { items: n.items, rights: n.rights, grievance: n.grievance };
    const sha = createHash("sha256").update(JSON.stringify({ title: n.title, ...body })).digest("hex");
    await c.query("INSERT IGNORE INTO consent_notices (id, language, title, body, sha256) VALUES (?,?,?,?,?)", [n.id, lang, n.title, JSON.stringify(body), sha]);
  }
  // Fellow terms and code of conduct (first versions effective at once).
  const terms = JSON.parse(readFileSync(`${root}/db/seed/fellow-terms.json`, "utf8"));
  for (const kind of ["fellow_terms", "code_of_conduct"]) for (const lang of ["en", "te", "hi"]) {
    const t = terms[kind][lang];
    const sha = createHash("sha256").update(JSON.stringify(t)).digest("hex");
    await c.query("INSERT IGNORE INTO terms_versions (id, kind, language, title, body, sha256, initial, effective_at) VALUES (?,?,?,?,?,?,TRUE, UTC_TIMESTAMP(3))",
      [`${kind.replace("_", "-")}-2026-11-${lang}`, kind, lang, t.title, JSON.stringify({ sections: t.sections }), sha]);
  }
  await c.query(
    "INSERT IGNORE INTO courses (id, slug, title, world, age_min, outcome, batch_size_max, sessions, fee_paise, fee_approved, published, kind) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [randomUUID(), "free-build-session", "Free Build Session", "robotics", 6, "Finish one real build in a small live session.", 6, 1, 0, true, true, "build_session"],
  );
  for (const [id, world, level, title, builds, pre, age] of PROJECTS) {
    await c.query("INSERT IGNORE INTO projects (id, world, level, title, builds, prerequisites, age_min) VALUES (?,?,?,?,?,?,?)", [id, world, level, title, builds, JSON.stringify(pre), age]);
  }
}

/** SAMPLE fixtures: placeholder fees and rates, flagged sample. Never in production. */
export async function seedSample(c) {
  const courses = [
    ["robo-ashaers-junior-l1", "Robo Ashaers · Junior · Level 1", "robotics", "Robo Ashaers", 7, 9, "Build and program a rover that follows your rules.", 8, "ASHAER pack (sample)", 400000],
    ["codo-ashaers-junior-l1", "CODO Ashaers · Junior · Level 1", "coding", "CODO Ashaers", 8, 10, "From blocks to your first Python program.", 8, null, 300000],
    ["advance-ashaers-iot-l1", "Advance Ashaers · IoT · Level 1", "iot", "Advance Ashaers", 9, 14, "A weather station that logs real data.", 8, "Sensor kit (sample)", 450000],
    ["money-basics-l1", "Money Basics · Level 1", "finlit", null, 10, 14, "Plan, save and price a tiny business. No investing tips.", 6, null, 200000],
    ["space-models-l1", "Space Models · Level 1", "space", null, 7, 12, "Orbit and satellite models with safe materials.", 6, "Model kit (sample)", 250000],
  ];
  for (const [slug, title, world, prog, amin, amax, outcome, sessions, kit, fee] of courses) {
    await c.query(
      "INSERT IGNORE INTO courses (id, slug, title, world, programme, age_min, age_max, outcome, batch_size_max, sessions, kit, fee_paise, fee_approved, sample, published) VALUES (?,?,?,?,?,?,?,?,8,?,?,?,FALSE,TRUE,TRUE)",
      [randomUUID(), slug, title, world, prog, amin, amax, outcome, sessions, kit, fee],
    );
  }
  const [rows] = await c.query("SELECT id, slug FROM courses WHERE slug IN (?)", [["free-build-session", ...courses.map((x) => x[0])]]);
  const slots = [[2, 10, "en", "online"], [3, 16, "te", "online"], [5, 11, "en", "offline"], [6, 17, "hi", "online"]];
  for (const co of rows) {
    const [[{ n }]] = await c.query("SELECT COUNT(*) AS n FROM batches WHERE course_id = ? AND starts_at > UTC_TIMESTAMP(3)", [co.id]);
    if (n > 0) continue;
    for (const [d, h, lang, mode] of slots) {
      await c.query("INSERT INTO batches (id, course_id, starts_at, duration_min, capacity, language, mode, location, educator_label) VALUES (?,?,?,60,6,?,?,?,?)",
        [randomUUID(), co.id, istAt(d, h), lang, mode, mode === "offline" ? "Partner centre, Hyderabad (sample)" : null, "Trainer · Sample"]);
    }
  }
  const rates = [["live_batch", 60000, 60], ["campus_session", 70000, 60], ["weekend_workshop", 150000, 180], ["doubt_desk", 30000, 30], ["project_mentor", 40000, 45], ["build_session", 50000, 60], ["shadow", 30000, 60], ["co_teach", 45000, 60], ["training_hour", 25000, 60], ["demo", 25000, 20]];
  for (const [k, p, m] of rates) await c.query("INSERT IGNORE INTO rate_card (gig_kind, per_session_paise, minutes, approved, sample) VALUES (?,?,?,FALSE,TRUE)", [k, p, m]);
  const rate = Object.fromEntries(rates.map(([k, p]) => [k, p]));
  const [gb] = await c.query(
    "SELECT b.id, b.starts_at, b.language, c.title, c.world, c.kit FROM batches b JOIN courses c ON c.id = b.course_id WHERE c.slug IN ('robo-ashaers-junior-l1','advance-ashaers-iot-l1') AND b.mode = 'online' AND b.starts_at > UTC_TIMESTAMP(3) AND NOT EXISTS (SELECT 1 FROM gigs g WHERE g.batch_id = b.id)",
  );
  for (const b of gb) {
    await c.query(
      "INSERT INTO gigs (id, kind, batch_id, title, world, language, starts_at, duration_min, mode, city, pay_paise, rate_sample, lesson_plan, kit_list) VALUES (?, 'live_batch', ?, ?, ?, ?, ?, 60, 'online', 'Hyderabad', ?, TRUE, ?, ?)",
      [randomUUID(), b.id, `${b.title} · Session 1`, b.world, b.language, b.starts_at, rate.live_batch, "Open with the finished build. Demo, then everyone builds. Debug together. Show and tell. One next step.", b.kit],
    );
  }
  const extra = [
    ["campus_session", "Robotics club · Sample Partner School", "robotics", 4, "offline", "Sample Partner School, Hyderabad (sample)", "Lab teacher on duty (sample)"],
    ["doubt_desk", "Coding Doubt Desk", "coding", 3, "online", null, null],
    ["shadow", "Shadow: Robo Ashaers live batch", "robotics", 2, "online", null, null],
    ["co_teach", "Co-teach: CODO Ashaers", "coding", 5, "online", null, null],
  ];
  for (const [k, t, w, d, m, loc, adult] of extra) {
    const [[{ n }]] = await c.query("SELECT COUNT(*) AS n FROM gigs WHERE title = ?", [t]);
    if (n > 0) continue;
    await c.query("INSERT INTO gigs (id, kind, title, world, language, starts_at, duration_min, mode, location, responsible_adult, city, pay_paise, rate_sample) VALUES (?,?,?,?,'en',?,60,?,?,?,'Hyderabad',?,TRUE)",
      [randomUUID(), k, t, w, istAt(d, 15), m, loc, adult, rate[k]]);
  }
}
