-- Add optional player bowling metadata used by CSV import and live auction UI.
-- Blank CSV cells must remain NULL; they must not imply No / Does not bowl.
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS bowling_style text,
  ADD COLUMN IF NOT EXISTS wicketkeeper text;

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
