-- Base data for every environment. Journey projects are a DRAFT sequence for the
-- curriculum team to replace; titles describe builds, not claims.
INSERT INTO courses (slug, title, world, age_min, age_max, outcome, batch_size_max, sessions, fee_paise, fee_approved, published, kind)
VALUES ('free-build-session', 'Free Build Session', 'robotics', 6, NULL, 'Finish one real build in a small live session.', 6, 1, 0, true, true, 'build_session')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO projects (id, world, level, title, builds, prerequisites, age_min) VALUES
 ('robotics-1-light',  'robotics', 1, 'First light', 'A circuit that switches an LED on and off', '{}', 6),
 ('robotics-1-buzz',   'robotics', 1, 'Buzz alarm', 'A buzzer alarm with a push button', '{robotics-1-light}', 6),
 ('robotics-2-rover',  'robotics', 2, 'Rover', 'A two-wheel rover you drive with code', '{robotics-1-buzz,coding-1-blocks}', 7),
 ('robotics-2-line',   'robotics', 2, 'Line follower', 'A rover that follows a black line', '{robotics-2-rover}', 8),
 ('robotics-3-arm',    'robotics', 3, 'Pick-and-place arm', 'A servo arm that sorts blocks', '{robotics-2-line,coding-2-python}', 9),
 ('coding-1-blocks',   'coding', 1, 'Block maze', 'A block program that solves a maze', '{}', 6),
 ('coding-2-python',   'coding', 2, 'Python turtle', 'Drawings made with Python loops', '{coding-1-blocks}', 8),
 ('iot-1-weather',     'iot', 1, 'Weather station', 'A sensor that logs temperature and humidity', '{robotics-1-light,coding-1-blocks}', 9),
 ('iot-2-plant',       'iot', 2, 'Smart plant', 'A pot that texts you when it needs water', '{iot-1-weather,coding-2-python}', 10),
 ('ai-1-sorter',       'ai', 1, 'Image sorter', 'A model you train to tell two objects apart', '{coding-2-python}', 10),
 ('ai-2-voice',        'ai', 2, 'Voice command robot', 'A rover that obeys spoken words', '{ai-1-sorter,robotics-2-rover}', 11),
 ('finlit-1-budget',   'finlit', 1, 'Pocket money plan', 'A savings plan with a goal chart', '{}', 8),
 ('finlit-2-stall',    'finlit', 2, 'Market stall', 'A tiny business plan with costs and price', '{finlit-1-budget}', 10),
 ('space-1-orbit',     'space', 1, 'Orbit model', 'A working model of planets in orbit', '{}', 7),
 ('space-2-sat',       'space', 2, 'Paper satellite', 'A satellite model with a sensor payload', '{space-1-orbit,iot-1-weather}', 10)
ON CONFLICT (id) DO NOTHING;
