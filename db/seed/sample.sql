-- SAMPLE FIXTURES for development and review builds only. Never load in production.
-- Fees here are placeholders to exercise the payment flow, flagged sample = true,
-- and the UI labels them "Sample fee".
INSERT INTO courses (slug, title, world, programme, age_min, age_max, outcome, batch_size_max, sessions, kit, fee_paise, fee_approved, sample, published) VALUES
 ('robo-ashaers-junior-l1', 'Robo Ashaers · Junior · Level 1', 'robotics', 'Robo Ashaers', 7, 9, 'Build and program a rover that follows your rules.', 8, 8, 'ASHAER pack (sample)', 400000, false, true, true),
 ('codo-ashaers-junior-l1', 'CODO Ashaers · Junior · Level 1', 'coding', 'CODO Ashaers', 8, 10, 'From blocks to your first Python program.', 8, 8, NULL, 300000, false, true, true),
 ('advance-ashaers-iot-l1', 'Advance Ashaers · IoT · Level 1', 'iot', 'Advance Ashaers', 9, 14, 'A weather station that logs real data.', 8, 8, 'Sensor kit (sample)', 450000, false, true, true),
 ('money-basics-l1', 'Money Basics · Level 1', 'finlit', NULL, 10, 14, 'Plan, save and price a tiny business. No investing tips.', 8, 6, NULL, 200000, false, true, true),
 ('space-models-l1', 'Space Models · Level 1', 'space', NULL, 7, 12, 'Orbit and satellite models with safe materials.', 8, 6, 'Model kit (sample)', 250000, false, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Batches start relative to now so the review build always has upcoming slots.
INSERT INTO batches (course_id, starts_at, duration_min, capacity, language, mode, location, educator_label)
SELECT c.id, (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') + (d || ' days')::interval + (h || ' hours')::interval) AT TIME ZONE 'Asia/Kolkata', 60, 6, l, m,
       CASE WHEN m = 'offline' THEN 'Partner centre, Hyderabad (sample)' END, 'Trainer · Sample'
FROM courses c,
     (VALUES (2, 10, 'en', 'online'), (3, 16, 'te', 'online'), (5, 11, 'en', 'offline'), (6, 17, 'hi', 'online')) AS s(d, h, l, m)
WHERE c.slug IN ('free-build-session', 'robo-ashaers-junior-l1', 'codo-ashaers-junior-l1', 'advance-ashaers-iot-l1', 'money-basics-l1', 'space-models-l1')
  AND NOT EXISTS (SELECT 1 FROM batches b WHERE b.course_id = c.id AND b.starts_at > now());

-- Phase 3 SAMPLE rate card (placeholders, flagged sample; real rates pending approval).
INSERT INTO rate_card (gig_kind, per_session_paise, minutes, approved, sample) VALUES
 ('live_batch', 60000, 60, false, true), ('campus_session', 70000, 60, false, true), ('weekend_workshop', 150000, 180, false, true),
 ('doubt_desk', 30000, 30, false, true), ('project_mentor', 40000, 45, false, true), ('build_session', 50000, 60, false, true),
 ('shadow', 30000, 60, false, true), ('co_teach', 45000, 60, false, true), ('training_hour', 25000, 60, false, true), ('demo', 25000, 20, false, true)
ON CONFLICT (gig_kind) DO NOTHING;

-- Phase 3 SAMPLE gigs (review builds only), priced from the sample rate card.
INSERT INTO gigs (kind, batch_id, title, world, language, starts_at, duration_min, mode, location, responsible_adult, city, pay_paise, rate_sample, lesson_plan, kit_list)
SELECT 'live_batch', b.id, c.title || ' · Session 1', c.world, b.language, b.starts_at, 60, 'online', NULL, NULL, 'Hyderabad', r.per_session_paise, true,
       'Open with the finished build. Demo, then everyone builds. Debug together. Show and tell. One next step.', c.kit
FROM batches b JOIN courses c ON c.id = b.course_id JOIN rate_card r ON r.gig_kind = 'live_batch'
WHERE c.slug IN ('robo-ashaers-junior-l1', 'advance-ashaers-iot-l1') AND b.mode = 'online' AND b.starts_at > now()
  AND NOT EXISTS (SELECT 1 FROM gigs g WHERE g.batch_id = b.id);
INSERT INTO gigs (kind, batch_id, title, world, language, starts_at, duration_min, mode, location, responsible_adult, city, pay_paise, rate_sample)
SELECT k, NULL, t, w, 'en', (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') + (d || ' days')::interval + interval '15 hours') AT TIME ZONE 'Asia/Kolkata', 60,
       m, loc, adult, 'Hyderabad', r.per_session_paise, true
FROM (VALUES
  ('campus_session', 'Robotics club · Sample Partner School', 'robotics', 4, 'offline', 'Sample Partner School, Hyderabad (sample)', 'Lab teacher on duty (sample)'),
  ('doubt_desk', 'Coding Doubt Desk', 'coding', 3, 'online', NULL, NULL),
  ('shadow', 'Shadow: Robo Ashaers live batch', 'robotics', 2, 'online', NULL, NULL),
  ('co_teach', 'Co-teach: CODO Ashaers', 'coding', 5, 'online', NULL, NULL)
) AS s(k, t, w, d, m, loc, adult) JOIN rate_card r ON r.gig_kind = s.k
WHERE NOT EXISTS (SELECT 1 FROM gigs g WHERE g.title = s.t);
