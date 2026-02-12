
-- Add cover image and regeneration count to projects
ALTER TABLE public.projects ADD COLUMN cover_image_url text;
ALTER TABLE public.projects ADD COLUMN cover_regen_count integer NOT NULL DEFAULT 0;
