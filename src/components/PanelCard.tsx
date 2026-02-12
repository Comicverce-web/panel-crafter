import { useState } from 'react';
import { Edit3, MessageSquare, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ImageLightbox } from '@/components/ImageLightbox';
import type { Panel } from '@/types/project';

interface PanelCardProps {
  panel: Panel;
  onUpdate: (id: string, updates: Partial<Panel>) => void;
  onRegenerate: (id: string, feedback: string) => void;
  isGenerating?: boolean;
  showDialogueInput?: boolean;
}

export function PanelCard({
  panel,
  onUpdate,
  onRegenerate,
  isGenerating = false,
  showDialogueInput = false,
}: PanelCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [dialogue, setDialogue] = useState(panel.dialogue || '');
  const [showLightbox, setShowLightbox] = useState(false);

  const handleRegenerate = () => {
    if (feedback.trim()) {
      onRegenerate(panel.id, feedback);
      setFeedback('');
      setIsEditing(false);
    }
  };

  const handleDialogueSave = () => {
    onUpdate(panel.id, { dialogue });
  };

  return (
    <>
      <div
        className={cn(
          "comic-panel group transition-all duration-300",
          isGenerating && "animate-pulse"
        )}
      >
        {/* Panel Number Badge */}
        <Badge className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground font-comic">
          #{panel.panel_number}
        </Badge>

        {/* Panel Image */}
        <div
          className="relative aspect-video bg-muted overflow-hidden cursor-pointer"
          onClick={() => panel.image_url && setShowLightbox(true)}
        >
          {panel.image_url ? (
            <img
              src={panel.image_url}
              alt={`Panel ${panel.panel_number}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : isGenerating ? (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted-foreground/10 to-muted animate-pulse" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground font-medium">Generating panel...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Waiting...</span>
            </div>
          )}

          {/* Dialogue Speech Bubble */}
          {panel.dialogue && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="speech-bubble max-w-[80%] text-sm">
                {panel.dialogue}
              </div>
            </div>
          )}

          {/* Edit button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Panel Description */}
        <div className="p-3 space-y-2">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {panel.description || 'No description'}
          </p>

          {/* Dialogue Input (shown in dialogue step) */}
          {showDialogueInput && (
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Dialogue</span>
              </div>
              <Textarea
                placeholder="Add dialogue for this panel..."
                value={dialogue}
                onChange={(e) => setDialogue(e.target.value)}
                className="min-h-[60px] text-sm bg-muted/50"
                disabled={isGenerating}
              />
              <Button
                variant="glow"
                size="sm"
                className="w-full"
                onClick={handleDialogueSave}
                disabled={isGenerating}
              >
                Save Dialogue
              </Button>
            </div>
          )}

          {/* Edit/Feedback Section */}
          {isEditing && (
            <div className="space-y-2 pt-2 border-t border-border animate-fade-in">
              <Textarea
                placeholder="Describe changes (e.g., 'Show more action', 'Change camera angle')"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[60px] text-sm bg-muted/50"
                disabled={isGenerating}
              />
              <div className="flex gap-2">
                <Button
                  variant="panel"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setFeedback('');
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  className="flex-1"
                  onClick={handleRegenerate}
                  disabled={!feedback.trim() || isGenerating}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-1", isGenerating && "animate-spin")} />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showLightbox && panel.image_url && (
        <ImageLightbox
          imageUrl={panel.image_url}
          alt={`Panel ${panel.panel_number}`}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  );
}
