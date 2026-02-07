-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  story TEXT,
  style TEXT NOT NULL DEFAULT 'comic' CHECK (style IN ('comic', 'manga')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'characters', 'panels', 'dialogues', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reference images table
CREATE TABLE public.reference_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create characters table
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_main BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create panels table
CREATE TABLE public.panels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  panel_number INTEGER NOT NULL,
  description TEXT,
  image_url TEXT,
  dialogue TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reference_images
CREATE POLICY "Users can view their project images" ON public.reference_images FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = reference_images.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can add images to their projects" ON public.reference_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = reference_images.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their project images" ON public.reference_images FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = reference_images.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for characters
CREATE POLICY "Users can view their project characters" ON public.characters FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can add characters to their projects" ON public.characters FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their project characters" ON public.characters FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their project characters" ON public.characters FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for panels
CREATE POLICY "Users can view their project panels" ON public.panels FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = panels.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can add panels to their projects" ON public.panels FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = panels.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their project panels" ON public.panels FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = panels.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their project panels" ON public.panels FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = panels.project_id AND projects.user_id = auth.uid()));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger for projects
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();