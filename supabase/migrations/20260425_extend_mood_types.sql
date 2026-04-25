-- ─────────────────────────────────────────────────────────────────────────────
-- Extend the mood_type enum with the new emotion options added to the UI.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query).
-- ─────────────────────────────────────────────────────────────────────────────

-- Add each new value only if it doesn't already exist
DO $$
BEGIN
  -- Extended positive emotions
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'excited'    AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'excited';    END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hopeful'    AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'hopeful';    END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'grateful'   AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'grateful';   END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'calm'       AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'calm';       END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'content'    AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'content';    END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'proud'      AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'proud';      END IF;

  -- Extended negative / neutral emotions
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'nervous'    AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'nervous';    END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'frustrated' AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'frustrated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'lonely'     AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'lonely';     END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'angry'      AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'angry';      END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'burned_out' AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'burned_out'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'confused'   AND enumtypid = 'mood_type'::regtype) THEN ALTER TYPE mood_type ADD VALUE 'confused';   END IF;
END $$;
