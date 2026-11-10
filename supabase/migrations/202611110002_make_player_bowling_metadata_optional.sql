-- Correct the initial metadata migration if it has already been applied.
-- Empty CSV cells should remain NULL, not be interpreted as No / Does not bowl.
ALTER TABLE public.players
  ALTER COLUMN bowling_style DROP DEFAULT,
  ALTER COLUMN bowling_style DROP NOT NULL,
  ALTER COLUMN wicketkeeper DROP DEFAULT,
  ALTER COLUMN wicketkeeper DROP NOT NULL;

ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS players_wicketkeeper_check;

ALTER TABLE public.players
  ADD CONSTRAINT players_wicketkeeper_check
  CHECK (wicketkeeper IS NULL OR wicketkeeper IN ('Yes', 'No'));
