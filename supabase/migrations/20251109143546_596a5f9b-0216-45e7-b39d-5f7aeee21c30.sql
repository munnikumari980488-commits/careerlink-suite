-- Add detailed profile fields for candidates
ALTER TABLE profiles
ADD COLUMN education jsonb DEFAULT '[]'::jsonb,
ADD COLUMN experience jsonb DEFAULT '[]'::jsonb,
ADD COLUMN projects jsonb DEFAULT '[]'::jsonb,
ADD COLUMN achievements jsonb DEFAULT '[]'::jsonb,
ADD COLUMN skills text[] DEFAULT ARRAY[]::text[],
ADD COLUMN bio text;