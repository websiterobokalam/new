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
