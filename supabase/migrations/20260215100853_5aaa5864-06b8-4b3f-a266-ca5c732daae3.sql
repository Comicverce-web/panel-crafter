
-- Add new structured fields to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS genre text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS settings text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS recommendations text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS num_pages integer NOT NULL DEFAULT 1;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS page_storylines jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS character_descriptions jsonb NOT NULL DEFAULT '[]'::jsonb;
