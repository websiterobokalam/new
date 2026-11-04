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

/** Plain-language notices for each automated check. Shown to Kalamites before they take effect. */
export const AUTOMATED_SYSTEMS = [
  ["course-draft-rules", "Course draft checks", "Rules read your course draft for things we never allow: investment or trading advice, live rocket propellants, contact details, home visits or private sessions outside the parent-supervised one-to-one format, and promises such as guaranteed results.", "A flag only puts a note in front of the reviewer. A person reads your draft and decides. It never changes your tier, pay or gigs."],
  ["course-draft-ai", "AI review of course drafts", "An AI model (Claude, by Anthropic) reads the text of your course draft (title, outcome, syllabus and kit only, never anything about children) and suggests issues for the reviewer: age fit, safety, clarity and honest claims.", "Suggestions only. A person reviews every draft and makes every decision. It never changes your tier, pay or gigs."],
  ["session-signals", "Teaching quality signals", "Rules look at your delivered sessions: observation scores, no-shows, low verified parent ratings and blocked attempts to share contact details.", "A flag starts a conversation with your point of contact. A person decides any action, with written reasons. Flags never change your tier or pay on their own."],
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
  // Kalamite terms and code of conduct (first versions effective at once).
  const terms = JSON.parse(readFileSync(`${root}/db/seed/fellow-terms.json`, "utf8"));
  for (const kind of ["fellow_terms", "code_of_conduct"]) for (const lang of ["en", "te", "hi"]) {
    const t = terms[kind][lang];
    const sha = createHash("sha256").update(JSON.stringify(t)).digest("hex");
    await c.query("INSERT IGNORE INTO terms_versions (id, kind, language, title, body, sha256, initial, effective_at) VALUES (?,?,?,?,?,?,TRUE, UTC_TIMESTAMP(3))",
      [`${kind.replace("_", "-")}-2026-11-${lang}`, kind, lang, t.title, JSON.stringify({ sections: t.sections }), sha]);
  }
  // Code of conduct v2 (one-to-one rules): published now, effective 14 days later (fair-work notice).
  const coc2 = JSON.parse(readFileSync(`${root}/db/seed/code-of-conduct-2026-12.json`, "utf8")).code_of_conduct;
  for (const lang of ["en", "te", "hi"]) {
    const t = coc2[lang];
    const sha = createHash("sha256").update(JSON.stringify(t)).digest("hex");
    await c.query("INSERT IGNORE INTO terms_versions (id, kind, language, title, body, sha256, initial, published_at, effective_at) VALUES (?,?,?,?,?,?,FALSE, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3) + INTERVAL 14 DAY)",
      [`code-of-conduct-2026-12-${lang}`, "code_of_conduct", lang, t.title, JSON.stringify({ sections: t.sections }), sha]);
  }
  // Kalamite terms and code of conduct (the name change from Kalam Fellows): published now, effective 14 days later.
  const kal = JSON.parse(readFileSync(`${root}/db/seed/kalamite-terms-2026-12.json`, "utf8"));
  for (const [kind, prefix] of [["fellow_terms", "kalamite-terms-2026-12"], ["code_of_conduct", "kalamite-code-2026-12"]]) for (const lang of ["en", "te", "hi"]) {
    const t = kal[kind][lang];
    const sha = createHash("sha256").update(JSON.stringify(t)).digest("hex");
    await c.query("INSERT IGNORE INTO terms_versions (id, kind, language, title, body, sha256, initial, published_at, effective_at) VALUES (?,?,?,?,?,?,FALSE, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3) + INTERVAL 14 DAY)",
      [`${prefix}-${lang}`, kind, lang, t.title, JSON.stringify({ sections: t.sections }), sha]);
  }
  await c.query(
    "INSERT IGNORE INTO courses (id, slug, title, world, age_min, outcome, batch_size_max, sessions, fee_paise, fee_approved, published, kind) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [randomUUID(), "free-build-session", "Free Build Session", "robotics", 6, "Finish one real build in a small live session.", 6, 1, 0, true, true, "build_session"],
  );
  // Cities: the pilot city starts as the only one taking Kalamites.
  const pilot = (process.env.PILOT_CITY ?? "Hyderabad").trim();
  await c.query("INSERT IGNORE INTO cities (slug, name, status, max_live) VALUES (?,?, 'pilot', ?)", [pilot.toLowerCase(), pilot, Number(process.env.PILOT_MAX_LIVE ?? 25)]);
  // Automated systems that affect Kalamites: published now, effective 14 days later (fair-work notice).
  for (const [id, name, description, affects] of AUTOMATED_SYSTEMS) {
    await c.query("INSERT IGNORE INTO automated_systems (id, name, description, affects, notice_at, effective_at) VALUES (?,?,?,?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3) + INTERVAL 14 DAY)", [id, name, description, affects]);
  }
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
  // A parent-supervised one-to-one course (online, one learner).
  await c.query(
    "INSERT IGNORE INTO courses (id, slug, title, world, programme, age_min, age_max, outcome, batch_size_max, sessions, kit, fee_paise, fee_approved, sample, published, format) VALUES (?,?,?,?,?,?,?,?,1,?,?,?,FALSE,TRUE,TRUE,'one_to_one')",
    [randomUUID(), "robotics-project-mentoring-1-1", "Robotics project mentoring · one-to-one", "robotics", "One-to-one, parent-supervised", 9, 17, "Finish your own robot project with an educator's full attention, one session at a time.", 4, null, 300000],
  );
  const [rows] = await c.query("SELECT id, slug, format FROM courses WHERE slug IN (?)", [["free-build-session", "robotics-project-mentoring-1-1", ...courses.map((x) => x[0])]]);
  const slots = [[2, 10, "en", "online"], [3, 16, "te", "online"], [5, 11, "en", "offline"], [6, 17, "hi", "online"]];
  for (const co of rows) {
    const [[{ n }]] = await c.query("SELECT COUNT(*) AS n FROM batches WHERE course_id = ? AND starts_at > UTC_TIMESTAMP(3)", [co.id]);
    if (n > 0) continue;
    for (const [d, h, lang, mode] of slots) {
      const oto = co.format === "one_to_one";
      if (oto && mode !== "online") continue;
      await c.query("INSERT INTO batches (id, course_id, starts_at, duration_min, capacity, language, mode, location, educator_label) VALUES (?,?,?,60,?,?,?,?,?)",
        [randomUUID(), co.id, istAt(d, h), oto ? 1 : 6, lang, mode, mode === "offline" ? "Partner centre, Hyderabad (sample)" : null, "Trainer · Sample"]);
    }
  }
  const rates = [["live_batch", 60000, 60], ["campus_session", 70000, 60], ["weekend_workshop", 150000, 180], ["doubt_desk", 30000, 30], ["project_mentor", 40000, 45], ["build_session", 50000, 60], ["shadow", 30000, 60], ["co_teach", 45000, 60], ["training_hour", 25000, 60], ["demo", 25000, 20], ["one_to_one", 50000, 60]];
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

/** SAMPLE partner school for review logins: admin 9000000101, trainer 9000000102 (test OTP only). */
export async function seedSampleSchool(c) {
  const [[have]] = await c.query("SELECT id FROM schools WHERE name = 'Sample Partner School (sample)'");
  if (have) return;
  const school = randomUUID(), lab = randomUUID(), admin = randomUUID(), trainer = randomUUID();
  await c.query("INSERT INTO schools (id, name, city, board, sla_hours, aadhya_tenant, erp_school_ref) VALUES (?,?,?,?,72,?,?)", [school, "Sample Partner School (sample)", "Hyderabad", "CBSE", "sample-tenant", "sample-erp"]);
  for (const [id, phone, role, name] of [[admin, "+919000000101", "school_admin", "Lakshmi (sample admin)"], [trainer, "+919000000102", "trainer", "Imran (sample trainer)"]]) {
    await c.query("INSERT IGNORE INTO accounts (id, phone_e164, role, display_name, adult_declared_at) VALUES (?,?,?,?, UTC_TIMESTAMP(3))", [id, phone, role, name]);
    await c.query("INSERT IGNORE INTO school_staff (account_id, school_id, role, display_name) VALUES (?,?,?,?)", [id, school, role, name]);
  }
  await c.query("INSERT INTO labs (id, school_id, name, room, installed_on) VALUES (?,?,?,?, UTC_DATE())", [lab, school, "21C STEM & AI Lab", "Block B, first floor"]);
  for (let i = 1; i <= 12; i++) await c.query("INSERT INTO lab_assets (id, lab_id, kind, label) VALUES (?,?,?,?)", [randomUUID(), lab, "kit", `ASHAER pack #${i}`]);
  for (let i = 1; i <= 6; i++) await c.query("INSERT INTO lab_assets (id, lab_id, kind, label) VALUES (?,?,?,?)", [randomUUID(), lab, "device", `Laptop #${i}`]);
  for (const [label, grade, world, weekday, time, ref] of [["Grade 6 B", 6, "robotics", 1, "10:00", "6B"], ["Grade 8 A", 8, "coding", 3, "11:30", "8A"], ["Grade 7 A", 7, "iot", 5, "09:15", null]]) {
    await c.query("INSERT INTO school_classes (id, school_id, lab_id, label, grade, world, weekday, start_time, duration_min, students, trainer_account_id, erp_class_ref) VALUES (?,?,?,?,?,?,?,?,45,30,?,?)",
      [randomUUID(), school, lab, label, grade, world, weekday, time, trainer, ref]);
  }
}
