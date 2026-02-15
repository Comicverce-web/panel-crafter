import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Project, ProjectStyle, ProjectStatus, ReferenceImage, Character, Panel } from '@/types/project';

export function useProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData as unknown as Project);

      // Load related data
      const [imagesRes, charsRes, panelsRes] = await Promise.all([
        supabase.from('reference_images').select('*').eq('project_id', projectId),
        supabase.from('characters').select('*').eq('project_id', projectId),
        supabase.from('panels').select('*').eq('project_id', projectId).order('panel_number'),
      ]);

      setReferenceImages((imagesRes.data as ReferenceImage[]) || []);
      setCharacters((charsRes.data as Character[]) || []);
      setPanels((panelsRes.data as Panel[]) || []);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: userId, title: 'Untitled Project' })
        .select()
        .single();

      if (error) throw error;
      setProject(data as unknown as Project);
      setReferenceImages([]);
      setCharacters([]);
      setPanels([]);
      return data as unknown as Project;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }, []);

  const updateProject = useCallback(async (updates: Partial<Project>) => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates as any)
        .eq('id', project.id);

      if (error) throw error;
      setProject({ ...project, ...updates });
    } catch (error) {
      console.error('Error updating project:', error);
    }
  }, [project]);

  const updateStory = useCallback((story: string) => {
    if (!project) return;
    setProject({ ...project, story });
    const timeout = setTimeout(() => {
      updateProject({ story });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [project, updateProject]);

  const updateTitle = useCallback((title: string) => {
    if (!project) return;
    setProject({ ...project, title });
    const timeout = setTimeout(() => {
      updateProject({ title });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [project, updateProject]);

  const updateField = useCallback((field: string, value: any) => {
    if (!project) return;
    setProject({ ...project, [field]: value });
    const timeout = setTimeout(() => {
      updateProject({ [field]: value } as any);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [project, updateProject]);

  const updateStyle = useCallback((style: ProjectStyle) => {
    updateProject({ style });
  }, [updateProject]);

  const updateStatus = useCallback((status: ProjectStatus) => {
    updateProject({ status });
  }, [updateProject]);

  const addReferenceImage = useCallback(async (file: File) => {
    if (!project) return;
    
    // Create a local URL for preview
    const imageUrl = URL.createObjectURL(file);
    const tempId = `temp-${Date.now()}`;
    
    setReferenceImages((prev) => [
      ...prev,
      { id: tempId, project_id: project.id, image_url: imageUrl, label: null, created_at: new Date().toISOString() },
    ]);

    // In a real implementation, you'd upload to storage here
    // For now, we'll keep the local URL
  }, [project]);

  const removeReferenceImage = useCallback(async (imageId: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== imageId));
    
    if (!imageId.startsWith('temp-')) {
      await supabase.from('reference_images').delete().eq('id', imageId);
    }
  }, []);

  const updateImageLabel = useCallback((imageId: string, label: string) => {
    setReferenceImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, label } : img))
    );
  }, []);

  const updateCharacter = useCallback(async (charId: string, updates: Partial<Character>) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, ...updates } : c))
    );
    
    if (!charId.startsWith('temp-')) {
      await supabase.from('characters').update(updates).eq('id', charId);
    }
  }, []);

  const updatePanel = useCallback(async (panelId: string, updates: Partial<Panel>) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, ...updates } : p))
    );
    
    if (!panelId.startsWith('temp-')) {
      await supabase.from('panels').update(updates).eq('id', panelId);
    }
  }, []);

  return {
    project,
    referenceImages,
    characters,
    panels,
    isLoading,
    isGenerating,
    setIsGenerating,
    loadProject,
    createProject,
    updateProject,
    updateStory,
    updateTitle,
    updateField,
    updateStyle,
    updateStatus,
    addReferenceImage,
    removeReferenceImage,
    updateImageLabel,
    setCharacters,
    setPanels,
    updateCharacter,
    updatePanel,
  };
}
