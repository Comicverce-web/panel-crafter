import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/project';

interface HistorySidebarProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  isLoading?: boolean;
}

export function HistorySidebar({
  projects,
  currentProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  isLoading,
}: HistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed left-0 top-1/2 -translate-y-1/2 z-50 h-12 w-6 rounded-l-none bg-card border border-l-0 border-border hover:bg-muted transition-all",
          isOpen && "left-64"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300",
          !isOpen && "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="font-comic text-xl text-gradient-primary">ComicForge</h1>
            </div>
            <Button
              variant="comic"
              className="w-full gap-2"
              onClick={onNewProject}
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>

          {/* Projects List */}
          <div className="flex-1 overflow-auto p-2">
            <div className="text-xs text-muted-foreground px-2 py-1 mb-2">
              Your Projects
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No projects yet. Create your first comic!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      "group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all",
                      currentProjectId === project.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/50"
                        : "hover:bg-sidebar-accent/50"
                    )}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {project.title}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {project.style} • {project.status}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">
              Powered by AI ✨
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
