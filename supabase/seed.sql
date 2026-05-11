-- ============================================================
-- UniWell Comprehensive Seed Data
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- Password for all students: UniWell2024!
-- ============================================================

-- 0. CLEANUP: Clear existing seed data to allow a fresh start
DO $$ 
BEGIN
    DELETE FROM public.profiles WHERE student_id LIKE '2023%';
    DELETE FROM auth.users WHERE email LIKE '%@student.uniwell.edu.ph';
END $$;

-- Temp table to track student UUID mappings
CREATE TEMP TABLE IF NOT EXISTS _seed_map (
  student_id TEXT PRIMARY KEY,
  user_id    UUID
);

-- ────────────────────────────────────────────────────────────
-- STEP 1: Create auth users (trigger auto-creates profiles)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  _uid UUID;
  _students JSONB := '[
    {"email":"juan.delacruz@student.uniwell.edu.ph","name":"Juan Dela Cruz","student_id":"202301684","course":"Computer Studies","year_level":1},
    {"email":"maria.santos@student.uniwell.edu.ph","name":"Maria Santos","student_id":"202301685","course":"Computer Studies","year_level":1},
    {"email":"jose.reyes@student.uniwell.edu.ph","name":"Jose Reyes","student_id":"202301686","course":"Computer Studies","year_level":2},
    {"email":"ana.gonzalez@student.uniwell.edu.ph","name":"Ana Gonzalez","student_id":"202301687","course":"Computer Studies","year_level":2},
    {"email":"carlos.mendoza@student.uniwell.edu.ph","name":"Carlos Mendoza","student_id":"202301688","course":"Computer Studies","year_level":3},
    {"email":"lucia.torres@student.uniwell.edu.ph","name":"Lucia Torres","student_id":"202301689","course":"Computer Studies","year_level":3},
    {"email":"miguel.ramirez@student.uniwell.edu.ph","name":"Miguel Ramirez","student_id":"202301690","course":"Computer Studies","year_level":4},
    {"email":"isabella.flores@student.uniwell.edu.ph","name":"Isabella Flores","student_id":"202301691","course":"Computer Studies","year_level":4},
    {"email":"sofia.jimenez@student.uniwell.edu.ph","name":"Sofia Jimenez","student_id":"202301692","course":"Business Administration","year_level":1},
    {"email":"luis.hernandez@student.uniwell.edu.ph","name":"Luis Hernandez","student_id":"202301693","course":"Business Administration","year_level":1},
    {"email":"valentina.lopez@student.uniwell.edu.ph","name":"Valentina Lopez","student_id":"202301694","course":"Business Administration","year_level":2},
    {"email":"sebastian.chavez@student.uniwell.edu.ph","name":"Sebastian Chavez","student_id":"202301695","course":"Business Administration","year_level":3},
    {"email":"camila.diaz@student.uniwell.edu.ph","name":"Camila Diaz","student_id":"202301696","course":"Business Administration","year_level":3},
    {"email":"mateo.vargas@student.uniwell.edu.ph","name":"Mateo Vargas","student_id":"202301697","course":"Business Administration","year_level":4},
    {"email":"andrea.castro@student.uniwell.edu.ph","name":"Andrea Castro","student_id":"202301698","course":"AB Music","year_level":1},
    {"email":"gabriel.romero@student.uniwell.edu.ph","name":"Gabriel Romero","student_id":"202301699","course":"AB Music","year_level":2},
    {"email":"daniela.gutierrez@student.uniwell.edu.ph","name":"Daniela Gutierrez","student_id":"202301700","course":"AB Music","year_level":3},
    {"email":"nicolas.alvarez@student.uniwell.edu.ph","name":"Nicolas Alvarez","student_id":"202301701","course":"AB Music","year_level":4},
    {"email":"fernanda.ruiz@student.uniwell.edu.ph","name":"Fernanda Ruiz","student_id":"202301702","course":"Political Science","year_level":1},
    {"email":"ricardo.torres@student.uniwell.edu.ph","name":"Ricardo Torres","student_id":"202301703","course":"Political Science","year_level":2},
    {"email":"natalia.perez@student.uniwell.edu.ph","name":"Natalia Perez","student_id":"202301704","course":"Political Science","year_level":3},
    {"email":"alejandro.cruz@student.uniwell.edu.ph","name":"Alejandro Cruz","student_id":"202301705","course":"Political Science","year_level":4},
    {"email":"mariana.vega@student.uniwell.edu.ph","name":"Mariana Vega","student_id":"202301706","course":"Tourism","year_level":1},
    {"email":"eduardo.rios@student.uniwell.edu.ph","name":"Eduardo Rios","student_id":"202301707","course":"Tourism","year_level":1},
    {"email":"catalina.mendez@student.uniwell.edu.ph","name":"Catalina Mendez","student_id":"202301708","course":"Tourism","year_level":2},
    {"email":"roberto.herrera@student.uniwell.edu.ph","name":"Roberto Herrera","student_id":"202301709","course":"Tourism","year_level":3},
    {"email":"adriana.moreno@student.uniwell.edu.ph","name":"Adriana Moreno","student_id":"202301710","course":"Tourism","year_level":4},
    {"email":"patricia.ortiz@student.uniwell.edu.ph","name":"Patricia Ortiz","student_id":"202301711","course":"Nursing","year_level":1},
    {"email":"manuel.serrano@student.uniwell.edu.ph","name":"Manuel Serrano","student_id":"202301712","course":"Nursing","year_level":2},
    {"email":"elena.ramos@student.uniwell.edu.ph","name":"Elena Ramos","student_id":"202301713","course":"Nursing","year_level":3},
    {"email":"fernando.castillo@student.uniwell.edu.ph","name":"Fernando Castillo","student_id":"202301714","course":"Nursing","year_level":4},
    {"email":"gloria.navarro@student.uniwell.edu.ph","name":"Gloria Navarro","student_id":"202301715","course":"Education","year_level":1},
    {"email":"hector.medina@student.uniwell.edu.ph","name":"Hector Medina","student_id":"202301716","course":"Education","year_level":2},
    {"email":"rosa.guerrero@student.uniwell.edu.ph","name":"Rosa Guerrero","student_id":"202301717","course":"Education","year_level":3},
    {"email":"antonio.delgado@student.uniwell.edu.ph","name":"Antonio Delgado","student_id":"202301718","course":"Education","year_level":4}
  ]';
  _s JSONB;
BEGIN
  FOR _s IN SELECT * FROM jsonb_array_elements(_students)
  LOOP
    -- Skip if email already exists
    SELECT id INTO _uid FROM auth.users WHERE email = (_s->>'email');
    IF _uid IS NULL THEN
      _uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_user_meta_data,
        raw_app_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        _uid, 'authenticated', 'authenticated',
        _s->>'email',
        crypt('UniWell2024!', gen_salt('bf')),
        now(),
        jsonb_build_object(
          'name',        _s->>'name',
          'student_id',  _s->>'student_id',
          'course',      _s->>'course',
          'year_level',  (_s->>'year_level')::int,
          'role',        'student'
        ),
        '{"provider":"email","providers":["email"]}'::jsonb,
        now(), now()
      );
    END IF;

    INSERT INTO _seed_map (student_id, user_id)
    VALUES (_s->>'student_id', _uid)
    ON CONFLICT (student_id) DO UPDATE SET user_id = EXCLUDED.user_id;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 2: Mood logs (realistic distribution over 30 days)
-- Good students → mostly rad/good | Critical → bad/awful | Silent → no logs
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  _logs JSONB := '[
    {"sid":"202301684","mood":"good","intensity":4,"note":"Excited about my project!","days_ago":1},
    {"sid":"202301684","mood":"rad","intensity":5,"note":"Got an A on my exam!","days_ago":4},
    {"sid":"202301684","mood":"good","intensity":4,"note":"Study group went well","days_ago":8},
    {"sid":"202301684","mood":"meh","intensity":3,"note":"Tired from deadlines","days_ago":14},
    {"sid":"202301684","mood":"good","intensity":4,"note":"Weekend was relaxing","days_ago":20},

    {"sid":"202301685","mood":"awful","intensity":1,"note":"Can''t sleep, overwhelmed","days_ago":1},
    {"sid":"202301685","mood":"bad","intensity":2,"note":"Too many requirements","days_ago":3},
    {"sid":"202301685","mood":"bad","intensity":2,"note":"Failed my quiz","days_ago":6},
    {"sid":"202301685","mood":"awful","intensity":1,"note":"Feeling hopeless about school","days_ago":10},
    {"sid":"202301685","mood":"bad","intensity":2,"note":"Family problems adding to stress","days_ago":15},

    {"sid":"202301686","mood":"meh","intensity":3,"note":"Average day, nothing special","days_ago":2},
    {"sid":"202301686","mood":"good","intensity":4,"note":"Submitted project on time","days_ago":7},
    {"sid":"202301686","mood":"meh","intensity":3,"note":"Midterms approaching","days_ago":12},
    {"sid":"202301686","mood":"meh","intensity":3,"note":"Feeling neutral today","days_ago":18},

    {"sid":"202301687","mood":"rad","intensity":5,"note":"Topped the class!","days_ago":1},
    {"sid":"202301687","mood":"good","intensity":4,"note":"Great feedback from professor","days_ago":5},
    {"sid":"202301687","mood":"good","intensity":4,"note":"Made new friends in my program","days_ago":10},
    {"sid":"202301687","mood":"rad","intensity":5,"note":"Dean''s list!","days_ago":20},

    {"sid":"202301688","mood":"bad","intensity":2,"note":"Struggling with thesis","days_ago":2},
    {"sid":"202301688","mood":"bad","intensity":2,"note":"Stressed about grades","days_ago":5},
    {"sid":"202301688","mood":"meh","intensity":3,"note":"Had some rest today","days_ago":9},
    {"sid":"202301688","mood":"bad","intensity":2,"note":"Thesis advisor rejected draft","days_ago":16},

    {"sid":"202301689","mood":"good","intensity":4,"note":"Internship going well","days_ago":3},
    {"sid":"202301689","mood":"meh","intensity":3,"note":"Presentation nerves","days_ago":8},
    {"sid":"202301689","mood":"good","intensity":4,"note":"Passed my defense","days_ago":14},

    {"sid":"202301690","mood":"awful","intensity":1,"note":"Panic attack before finals","days_ago":1},
    {"sid":"202301690","mood":"bad","intensity":2,"note":"Barely sleeping","days_ago":4},
    {"sid":"202301690","mood":"awful","intensity":1,"note":"Considering dropping out","days_ago":7},
    {"sid":"202301690","mood":"bad","intensity":2,"note":"Parents are pressuring me","days_ago":12},

    {"sid":"202301691","mood":"meh","intensity":3,"note":"Graduation stress","days_ago":2},
    {"sid":"202301691","mood":"good","intensity":4,"note":"Job interview went well","days_ago":6},
    {"sid":"202301691","mood":"meh","intensity":3,"note":"Waiting for results","days_ago":11},
    {"sid":"202301691","mood":"good","intensity":4,"note":"Got the job offer!","days_ago":25},

    {"sid":"202301692","mood":"good","intensity":4,"note":"Business case competition prep","days_ago":1},
    {"sid":"202301692","mood":"rad","intensity":5,"note":"Won the competition!","days_ago":5},
    {"sid":"202301692","mood":"good","intensity":4,"note":"Great group dynamics","days_ago":10},

    {"sid":"202301693","mood":"bad","intensity":2,"note":"Financial stress","days_ago":2},
    {"sid":"202301693","mood":"awful","intensity":1,"note":"Can''t afford textbooks","days_ago":6},
    {"sid":"202301693","mood":"bad","intensity":2,"note":"Part-time job exhausting","days_ago":11},
    {"sid":"202301693","mood":"meh","intensity":3,"note":"Got a small scholarship","days_ago":18},

    {"sid":"202301694","mood":"meh","intensity":3,"note":"Adjusting to new sem","days_ago":3},
    {"sid":"202301694","mood":"meh","intensity":3,"note":"So much to learn","days_ago":9},
    {"sid":"202301694","mood":"good","intensity":4,"note":"Found my study rhythm","days_ago":15},

    {"sid":"202301695","mood":"good","intensity":4,"note":"Marketing class is interesting","days_ago":4},
    {"sid":"202301695","mood":"bad","intensity":2,"note":"Group conflict in project","days_ago":9},
    {"sid":"202301695","mood":"meh","intensity":3,"note":"Resolved the conflict","days_ago":13},
    {"sid":"202301695","mood":"good","intensity":4,"note":"Project submitted!","days_ago":20},

    {"sid":"202301696","mood":"awful","intensity":1,"note":"Family medical emergency","days_ago":2},
    {"sid":"202301696","mood":"bad","intensity":2,"note":"Missing classes due to family","days_ago":5},
    {"sid":"202301696","mood":"bad","intensity":2,"note":"Behind on all requirements","days_ago":9},
    {"sid":"202301696","mood":"awful","intensity":1,"note":"Feeling completely lost","days_ago":14},

    {"sid":"202301697","mood":"meh","intensity":3,"note":"Last sem, feeling uncertain","days_ago":3},
    {"sid":"202301697","mood":"good","intensity":4,"note":"Job hunting progress","days_ago":8},
    {"sid":"202301697","mood":"meh","intensity":3,"note":"Resume rejections","days_ago":14},

    {"sid":"202301698","mood":"rad","intensity":5,"note":"Music recital was perfect!","days_ago":1},
    {"sid":"202301698","mood":"good","intensity":4,"note":"Loving my music theory class","days_ago":6},
    {"sid":"202301698","mood":"good","intensity":4,"note":"Practice paid off","days_ago":12},

    {"sid":"202301699","mood":"good","intensity":4,"note":"Ensemble practice going great","days_ago":2},
    {"sid":"202301699","mood":"meh","intensity":3,"note":"Tired after long rehearsal","days_ago":7},
    {"sid":"202301699","mood":"good","intensity":4,"note":"Solo performance prep","days_ago":13},

    {"sid":"202301700","mood":"meh","intensity":3,"note":"Composition deadline stress","days_ago":4},
    {"sid":"202301700","mood":"bad","intensity":2,"note":"Creative block","days_ago":8},
    {"sid":"202301700","mood":"meh","intensity":3,"note":"Slowly finding inspiration","days_ago":14},

    {"sid":"202301701","mood":"good","intensity":4,"note":"Senior recital planning","days_ago":3},
    {"sid":"202301701","mood":"good","intensity":4,"note":"Networking at music festival","days_ago":9},
    {"sid":"202301701","mood":"rad","intensity":5,"note":"Got performance scholarship!","days_ago":18},

    {"sid":"202301702","mood":"good","intensity":4,"note":"Mock election debate!","days_ago":2},
    {"sid":"202301702","mood":"good","intensity":4,"note":"Passionate about governance","days_ago":7},
    {"sid":"202301702","mood":"meh","intensity":3,"note":"Reading overload","days_ago":13},

    {"sid":"202301703","mood":"bad","intensity":2,"note":"Thesis research overwhelming","days_ago":3},
    {"sid":"202301703","mood":"meh","intensity":3,"note":"Small progress today","days_ago":8},
    {"sid":"202301703","mood":"bad","intensity":2,"note":"Advisor not available","days_ago":14},

    {"sid":"202301704","mood":"meh","intensity":3,"note":"Policy paper is tough","days_ago":4},
    {"sid":"202301704","mood":"good","intensity":4,"note":"Seminar went well","days_ago":10},
    {"sid":"202301704","mood":"meh","intensity":3,"note":"Lots of reading","days_ago":17},

    {"sid":"202301705","mood":"rad","intensity":5,"note":"Got published in school journal!","days_ago":2},
    {"sid":"202301705","mood":"good","intensity":4,"note":"Political internship secured","days_ago":7},
    {"sid":"202301705","mood":"good","intensity":4,"note":"Final thesis approved","days_ago":15},

    {"sid":"202301706","mood":"good","intensity":4,"note":"Tourism expo was amazing!","days_ago":1},
    {"sid":"202301706","mood":"meh","intensity":3,"note":"Long field trip","days_ago":5},
    {"sid":"202301706","mood":"good","intensity":4,"note":"Travel writing assignment fun","days_ago":10},

    {"sid":"202301707","mood":"bad","intensity":2,"note":"Homesick and overwhelmed","days_ago":2},
    {"sid":"202301707","mood":"awful","intensity":1,"note":"No friends yet, feel isolated","days_ago":5},
    {"sid":"202301707","mood":"bad","intensity":2,"note":"Academic adjustment hard","days_ago":10},
    {"sid":"202301707","mood":"meh","intensity":3,"note":"Starting to adjust slowly","days_ago":16},

    {"sid":"202301708","mood":"meh","intensity":3,"note":"Hospitality training is tiring","days_ago":3},
    {"sid":"202301708","mood":"good","intensity":4,"note":"OJT placement confirmed","days_ago":8},
    {"sid":"202301708","mood":"meh","intensity":3,"note":"Balancing work and school","days_ago":15},

    {"sid":"202301709","mood":"good","intensity":4,"note":"OJT at resort going great","days_ago":4},
    {"sid":"202301709","mood":"good","intensity":4,"note":"Learning so much practically","days_ago":10},
    {"sid":"202301709","mood":"rad","intensity":5,"note":"Best OJT experience!","days_ago":22},

    {"sid":"202301710","mood":"meh","intensity":3,"note":"Job search is stressful","days_ago":3},
    {"sid":"202301710","mood":"good","intensity":4,"note":"Interview callback!","days_ago":8},
    {"sid":"202301710","mood":"meh","intensity":3,"note":"Waiting nervously","days_ago":14},

    {"sid":"202301711","mood":"bad","intensity":2,"note":"Night duty draining","days_ago":1},
    {"sid":"202301711","mood":"awful","intensity":1,"note":"Made a clinical mistake, scared","days_ago":4},
    {"sid":"202301711","mood":"bad","intensity":2,"note":"Still shaken from incident","days_ago":7},
    {"sid":"202301711","mood":"meh","intensity":3,"note":"Supervisor was supportive","days_ago":12},

    {"sid":"202301712","mood":"meh","intensity":3,"note":"Board exam anxiety setting in","days_ago":2},
    {"sid":"202301712","mood":"bad","intensity":2,"note":"Review overwhelming","days_ago":6},
    {"sid":"202301712","mood":"meh","intensity":3,"note":"Study group helping","days_ago":11},
    {"sid":"202301712","mood":"bad","intensity":2,"note":"Burnout feeling","days_ago":18},

    {"sid":"202301713","mood":"good","intensity":4,"note":"Excellent clinical evaluation","days_ago":3},
    {"sid":"202301713","mood":"good","intensity":4,"note":"Patient care is fulfilling","days_ago":9},
    {"sid":"202301713","mood":"meh","intensity":3,"note":"Double shift exhaustion","days_ago":15},

    {"sid":"202301714","mood":"meh","intensity":3,"note":"Graduation thesis defense near","days_ago":4},
    {"sid":"202301714","mood":"good","intensity":4,"note":"Defense panel was satisfied","days_ago":9},
    {"sid":"202301714","mood":"rad","intensity":5,"note":"Passed licensure exam!","days_ago":20},

    {"sid":"202301715","mood":"good","intensity":4,"note":"Love teaching demo class!","days_ago":2},
    {"sid":"202301715","mood":"good","intensity":4,"note":"Cooperating teacher is great","days_ago":6},
    {"sid":"202301715","mood":"meh","intensity":3,"note":"Lesson planning is hard","days_ago":12},

    {"sid":"202301716","mood":"meh","intensity":3,"note":"Student teaching stress","days_ago":3},
    {"sid":"202301716","mood":"bad","intensity":2,"note":"Classroom management issues","days_ago":7},
    {"sid":"202301716","mood":"meh","intensity":3,"note":"Got better tips from mentor","days_ago":13},

    {"sid":"202301717","mood":"good","intensity":4,"note":"Innovative lesson plan approved","days_ago":1},
    {"sid":"202301717","mood":"good","intensity":4,"note":"Students responded well","days_ago":6},
    {"sid":"202301717","mood":"rad","intensity":5,"note":"Best teaching demo!","days_ago":14},

    {"sid":"202301718","mood":"meh","intensity":3,"note":"Board exam in 2 months","days_ago":2},
    {"sid":"202301718","mood":"meh","intensity":3,"note":"Review is manageable","days_ago":7},
    {"sid":"202301718","mood":"good","intensity":4,"note":"Mock exam results good","days_ago":14}
  ]';
  _l JSONB;
  _uid UUID;
  _log_id BIGINT;
BEGIN
  FOR _l IN SELECT * FROM jsonb_array_elements(_logs)
  LOOP
    SELECT user_id INTO _uid FROM _seed_map WHERE student_id = (_l->>'sid');
    IF _uid IS NOT NULL THEN
      INSERT INTO public.mood_logs (user_id, mood_type, intensity, note, logged_at)
      VALUES (
        _uid,
        (_l->>'mood')::public.mood_type,
        (_l->>'intensity')::smallint,
        _l->>'note',
        now() - ((_l->>'days_ago')::int * interval '1 day')
      )
      RETURNING id INTO _log_id;
    END IF;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 3: Mood triggers linked to recent logs
-- ────────────────────────────────────────────────────────────
INSERT INTO public.mood_triggers (log_id, trigger_category)
SELECT ml.id, 'Academics'::public.trigger_category
FROM public.mood_logs ml
JOIN public.profiles p ON p.id = ml.user_id
WHERE p.student_id IN ('202301685','202301688','202301690','202301696','202301703')
  AND NOT EXISTS (SELECT 1 FROM public.mood_triggers mt WHERE mt.log_id = ml.id AND mt.trigger_category = 'Academics');

INSERT INTO public.mood_triggers (log_id, trigger_category)
SELECT ml.id, 'Health'::public.trigger_category
FROM public.mood_logs ml
JOIN public.profiles p ON p.id = ml.user_id
WHERE p.student_id IN ('202301711','202301712','202301690','202301707')
  AND NOT EXISTS (SELECT 1 FROM public.mood_triggers mt WHERE mt.log_id = ml.id AND mt.trigger_category = 'Health');

INSERT INTO public.mood_triggers (log_id, trigger_category)
SELECT ml.id, 'Finance'::public.trigger_category
FROM public.mood_logs ml
JOIN public.profiles p ON p.id = ml.user_id
WHERE p.student_id IN ('202301693','202301707')
  AND NOT EXISTS (SELECT 1 FROM public.mood_triggers mt WHERE mt.log_id = ml.id AND mt.trigger_category = 'Finance');

INSERT INTO public.mood_triggers (log_id, trigger_category)
SELECT ml.id, 'Social'::public.trigger_category
FROM public.mood_logs ml
JOIN public.profiles p ON p.id = ml.user_id
WHERE p.student_id IN ('202301695','202301707','202301685')
  AND NOT EXISTS (SELECT 1 FROM public.mood_triggers mt WHERE mt.log_id = ml.id AND mt.trigger_category = 'Social');

INSERT INTO public.mood_triggers (log_id, trigger_category)
SELECT ml.id, 'Personal Growth'::public.trigger_category
FROM public.mood_logs ml
JOIN public.profiles p ON p.id = ml.user_id
WHERE p.student_id IN ('202301687','202301701','202301705','202301717','202301714')
  AND NOT EXISTS (SELECT 1 FROM public.mood_triggers mt WHERE mt.log_id = ml.id AND mt.trigger_category = 'Personal Growth');

INSERT INTO public.mood_triggers (log_id, trigger_category)
SELECT ml.id, 'Family'::public.trigger_category
FROM public.mood_logs ml
JOIN public.profiles p ON p.id = ml.user_id
WHERE p.student_id IN ('202301690','202301696')
  AND NOT EXISTS (SELECT 1 FROM public.mood_triggers mt WHERE mt.log_id = ml.id AND mt.trigger_category = 'Family');

-- ────────────────────────────────────────────────────────────
-- STEP 4: Pending coping strategies for moderation queue
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  _uid UUID;
BEGIN
  SELECT user_id INTO _uid FROM _seed_map WHERE student_id = '202301684';
  INSERT INTO public.coping_strategies (submitter_id, category, title, description, trigger_tags, status, helpful_count)
  VALUES
    (_uid, 'Mindfulness', 'One-Line Journal',
     'Just one sentence a day. The pressure to write "properly" killed my old journal habit.',
     '["Academics","Personal Growth"]', 'pending', 0),
    (_uid, 'Mindfulness', '3-Breath Reset',
     'When I feel overwhelmed, I pause and take three slow, deep breaths. It helps me reset before reacting.',
     '["Academics"]', 'pending', 0);

  SELECT user_id INTO _uid FROM _seed_map WHERE student_id = '202301687';
  INSERT INTO public.coping_strategies (submitter_id, category, title, description, trigger_tags, status, helpful_count)
  VALUES
    (_uid, 'Time Management', 'Weekly Sunset Review',
     'Every Sunday evening I spend 15 minutes reviewing what worked and planning the week ahead.',
     '["Academics","Personal Growth"]', 'pending', 7),
    (_uid, 'Physical Activity', '10-Minute Walk Between Classes',
     'Even a short walk between buildings clears my head better than doom-scrolling.',
     '["Academics","Health"]', 'approved', 12);

  SELECT user_id INTO _uid FROM _seed_map WHERE student_id = '202301701';
  INSERT INTO public.coping_strategies (submitter_id, category, title, description, trigger_tags, status, helpful_count)
  VALUES
    (_uid, 'Creative Expression', 'Music as Emotional Outlet',
     'Playing an instrument for 10 minutes after a stressful class releases tension I didn''t know I was holding.',
     '["Personal Growth","Academics"]', 'approved', 19);

  SELECT user_id INTO _uid FROM _seed_map WHERE student_id = '202301713';
  INSERT INTO public.coping_strategies (submitter_id, category, title, description, trigger_tags, status, helpful_count)
  VALUES
    (_uid, 'Social Support', 'Peer Check-In Buddy System',
     'Me and a classmate text each other "1-5, how are you?" every evening. It takes 10 seconds and opens real conversations.',
     '["Social","Health"]', 'pending', 3);
END $$;

-- ────────────────────────────────────────────────────────────
-- DONE — Clean up temp table
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS _seed_map;

-- Verify
SELECT course, year_level, count(*) as students
FROM public.profiles
WHERE role = 'student'
GROUP BY course, year_level
ORDER BY course, year_level;
