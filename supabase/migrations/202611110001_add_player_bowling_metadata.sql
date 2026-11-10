-- Add player bowling metadata used by the CSV import and live auction UI.
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS bowling_style text NOT NULL DEFAULT 'Does not bowl',
  ADD COLUMN IF NOT EXISTS wicketkeeper text NOT NULL DEFAULT 'No';

ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS players_wicketkeeper_check;

ALTER TABLE public.players
  ADD CONSTRAINT players_wicketkeeper_check
  CHECK (wicketkeeper IN ('Yes', 'No'));
