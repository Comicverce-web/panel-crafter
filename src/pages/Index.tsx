import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HistorySidebar } from '@/components/HistorySidebar';
import { StoryInput } from '@/components/StoryInput';
import { PreviewPanel } from '@/components/PreviewPanel';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';
import type { Project, Character, Panel } from '@/types/project';
import type { User } from '@supabase/supabase-js';

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const {
    project,
    referenceImages,
    characters,
    panels,
    isLoading,
    isGenerating,
    setIsGenerating,
    loadProject,
    createProject,
    updateStory,
    updateStyle,
    updateStatus,
    addReferenceImage,
    removeReferenceImage,
    updateImageLabel,
    setCharacters,
    setPanels,
    updateCharacter,
    updatePanel,
  } = useProject();

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load projects
  useEffect(() => {
    if (!user) return;

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        toast.error('Failed to load projects');
      } else {
        setProjects((data as Project[]) || []);
        // Auto-load first project or create new one
        if (data && data.length > 0) {
          loadProject(data[0].id);
        } else {
          handleNewProject();
        }
      }
      setIsLoadingProjects(false);
    };

    loadProjects();
  }, [user]);

  const handleNewProject = useCallback(async () => {
    if (!user) return;
    const newProject = await createProject(user.id);
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
      toast.success('New project created!');
    }
  }, [user, createProject]);

  const handleSelectProject = useCallback((projectId: string) => {
    loadProject(projectId);
  }, [loadProject]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      toast.error('Failed to delete project');
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (project?.id === projectId) {
        // Load another project or create new
        const remaining = projects.filter((p) => p.id !== projectId);
        if (remaining.length > 0) {
          loadProject(remaining[0].id);
        } else {
          handleNewProject();
        }
      }
      toast.success('Project deleted');
    }
  }, [project, projects, loadProject, handleNewProject]);

  // AI Generation functions
  const generateCharacters = useCallback(async () => {
    if (!project) return;
    setIsGenerating(true);
    
    try {
      const response = await supabase.functions.invoke('generate-characters', {
        body: { 
          story: project.story,
          style: project.style,
          referenceImages: referenceImages.map(img => ({ url: img.image_url, label: img.label }))
        }
      });

      if (response.error) throw response.error;

      const generatedChars = response.data.characters as Character[];
      setCharacters(generatedChars.map((c, i) => ({
        ...c,
        id: `temp-${Date.now()}-${i}`,
        project_id: project.id,
        created_at: new Date().toISOString(),
      })));

      updateStatus('characters');
      toast.success('Characters generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate characters');
    } finally {
      setIsGenerating(false);
    }
  }, [project, referenceImages, setCharacters, updateStatus, setIsGenerating]);

  const confirmCharacters = useCallback(async () => {
    if (!project) return;
    setIsGenerating(true);

    try {
      // Save characters to DB
      for (const char of characters) {
        if (char.id.startsWith('temp-')) {
          await supabase.from('characters').insert({
            project_id: project.id,
            name: char.name,
            description: char.description,
            image_url: char.image_url,
            is_main: char.is_main,
          });
        }
      }

      // Generate panels
      const response = await supabase.functions.invoke('generate-panels', {
        body: {
          story: project.story,
          style: project.style,
          characters: characters.map(c => ({ name: c.name, description: c.description })),
        }
      });

      if (response.error) throw response.error;

      const generatedPanels = response.data.panels as Panel[];
      setPanels(generatedPanels.map((p, i) => ({
        ...p,
        id: `temp-${Date.now()}-${i}`,
        project_id: project.id,
        panel_number: i + 1,
        created_at: new Date().toISOString(),
      })));

      updateStatus('panels');
      toast.success('Panels generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate panels');
    } finally {
      setIsGenerating(false);
    }
  }, [project, characters, setPanels, updateStatus, setIsGenerating]);

  const confirmPanels = useCallback(async () => {
    if (!project) return;

    // Save panels to DB
    for (const panel of panels) {
      if (panel.id.startsWith('temp-')) {
        await supabase.from('panels').insert({
          project_id: project.id,
          panel_number: panel.panel_number,
          description: panel.description,
          image_url: panel.image_url,
        });
      }
    }

    updateStatus('dialogues');
  }, [project, panels, updateStatus]);

  const regenerateCharacter = useCallback(async (charId: string, feedback: string) => {
    setIsGenerating(true);
    try {
      const char = characters.find(c => c.id === charId);
      if (!char) return;

      const response = await supabase.functions.invoke('regenerate-character', {
        body: {
          character: char,
          feedback,
          style: project?.style,
        }
      });

      if (response.error) throw response.error;
      
      updateCharacter(charId, response.data.character);
      toast.success('Character regenerated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate character');
    } finally {
      setIsGenerating(false);
    }
  }, [characters, project, updateCharacter, setIsGenerating]);

  const regeneratePanel = useCallback(async (panelId: string, feedback: string) => {
    setIsGenerating(true);
    try {
      const panel = panels.find(p => p.id === panelId);
      if (!panel) return;

      const response = await supabase.functions.invoke('regenerate-panel', {
        body: {
          panel,
          feedback,
          style: project?.style,
        }
      });

      if (response.error) throw response.error;
      
      updatePanel(panelId, response.data.panel);
      toast.success('Panel regenerated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate panel');
    } finally {
      setIsGenerating(false);
    }
  }, [panels, project, updatePanel, setIsGenerating]);

  const downloadPDF = useCallback(async () => {
    toast.info('PDF generation coming soon!');
    // In a full implementation, this would call an edge function to generate PDF
  }, []);

  if (!user || isLoadingProjects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* History Sidebar */}
      <HistorySidebar
        projects={projects}
        currentProjectId={project?.id || null}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        isLoading={isLoadingProjects}
      />

      {/* Main Content */}
      <div className="ml-64 min-h-screen transition-all duration-300">
        <div className="flex h-screen">
          {/* Left Panel - Story Input */}
          <div className="w-1/2 p-6 overflow-auto border-r border-border">
            <StoryInput
              story={project?.story || ''}
              onStoryChange={updateStory}
              referenceImages={referenceImages}
              onAddImage={addReferenceImage}
              onRemoveImage={removeReferenceImage}
              onUpdateLabel={updateImageLabel}
              isGenerating={isGenerating}
            />
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 p-6 overflow-auto">
            <PreviewPanel
              style={project?.style || 'comic'}
              onStyleChange={updateStyle}
              status={project?.status || 'draft'}
              onStatusChange={updateStatus}
              characters={characters}
              panels={panels}
              onCharacterUpdate={updateCharacter}
              onCharacterRegenerate={regenerateCharacter}
              onPanelUpdate={updatePanel}
              onPanelRegenerate={regeneratePanel}
              onGenerateCharacters={generateCharacters}
              onConfirmCharacters={confirmCharacters}
              onGeneratePanels={confirmCharacters}
              onConfirmPanels={confirmPanels}
              onDownload={downloadPDF}
              isGenerating={isGenerating}
              storyLength={project?.story?.length || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
