import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HistorySidebar } from '@/components/HistorySidebar';
import { StoryInput } from '@/components/StoryInput';
import { PreviewPanel } from '@/components/PreviewPanel';
import { MangaReader } from '@/components/MangaReader';
import { useProject } from '@/hooks/useProject';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import type { Project, Character, Panel } from '@/types/project';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [showReader, setShowReader] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, isLoading: isProfileLoading } = useProfile(user);

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
    updateProject,
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
        setProjects((data as unknown as Project[]) || []);
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
    const selected = projects.find(p => p.id === projectId);
    // If complete, open reader directly
    if (selected?.status === 'complete') {
      loadProject(projectId);
      setShowReader(true);
    } else {
      loadProject(projectId);
      setShowReader(false);
    }
  }, [loadProject, projects]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      toast.error('Failed to delete project');
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (project?.id === projectId) {
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
          title: project.title,
          genre: project.genre,
          theme: project.theme,
          settings: project.settings,
          recommendations: project.recommendations,
          pageStorylines: project.page_storylines,
          characterDescriptions: project.character_descriptions,
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
        body: { character: char, feedback, style: project?.style },
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
        body: { panel, feedback, style: project?.style },
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

  const generateCover = useCallback(async (feedback?: string) => {
    if (!project) return;
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-cover', {
        body: {
          title: project.title,
          story: project.story,
          style: project.style,
          characters: characters.map(c => ({ name: c.name, description: c.description })),
          feedback,
        }
      });
      if (response.error) throw response.error;
      const newCount = (project.cover_regen_count || 0) + (feedback ? 1 : 0);
      updateProject({
        cover_image_url: response.data.cover_image_url,
        cover_regen_count: newCount,
        status: 'cover',
      });
      toast.success(feedback ? 'Cover regenerated!' : 'Cover generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate cover');
    } finally {
      setIsGenerating(false);
    }
  }, [project, characters, updateProject, setIsGenerating]);

  const downloadPDF = useCallback(async () => {
    toast.info('PDF generation coming soon!');
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

  // Reader mode
  if (showReader && project) {
    return (
      <MangaReader
        coverImageUrl={project.cover_image_url}
        panels={panels}
        title={project.title}
        onClose={() => setShowReader(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HistorySidebar
        projects={projects}
        currentProjectId={project?.id || null}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        isLoading={isLoadingProjects}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        profile={profile}
        userEmail={user?.email || null}
        isProfileLoading={isProfileLoading}
      />
      <div className={cn("min-h-screen transition-all duration-300", sidebarOpen ? "ml-64" : "ml-0")}>
        <ResizablePanelGroup direction="horizontal" className="h-screen">
          <ResizablePanel defaultSize={50} minSize={25} maxSize={75}>
            <div className="h-full p-6 overflow-auto">
              <StoryInput
                title={project?.title || ''}
                onTitleChange={updateTitle}
                genre={project?.genre || ''}
                onGenreChange={(v) => updateField('genre', v)}
                story={project?.story || ''}
                onStoryChange={updateStory}
                numPages={project?.num_pages || 1}
                onNumPagesChange={(v) => updateField('num_pages', v)}
                pageStorylines={(project?.page_storylines as string[]) || []}
                onPageStorylinesChange={(v) => updateField('page_storylines', v)}
                characterDescriptions={(project?.character_descriptions as any[]) || []}
                onCharacterDescriptionsChange={(v) => updateField('character_descriptions', v)}
                theme={project?.theme || ''}
                onThemeChange={(v) => updateField('theme', v)}
                settings={project?.settings || ''}
                onSettingsChange={(v) => updateField('settings', v)}
                recommendations={project?.recommendations || ''}
                onRecommendationsChange={(v) => updateField('recommendations', v)}
                referenceImages={referenceImages}
                onAddImage={addReferenceImage}
                onRemoveImage={removeReferenceImage}
                onUpdateLabel={updateImageLabel}
                isGenerating={isGenerating}
                disabled={false}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={25} maxSize={75}>
            <div className="h-full p-6 overflow-auto">
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
              onGenerateCover={generateCover}
              onOpenReader={() => setShowReader(true)}
              isGenerating={isGenerating}
              storyLength={project?.story?.length || 0}
              coverImageUrl={project?.cover_image_url || null}
              coverRegenCount={project?.cover_regen_count || 0}
            />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
