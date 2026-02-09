import { useState } from 'react';
import { Edit3, Check, RefreshCw, User, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Character } from '@/types/project';

interface CharacterCardProps {
  character: Character;
  onUpdate: (id: string, updates: Partial<Character>) => void;
  onRegenerate: (id: string, feedback: string) => void;
  isGenerating?: boolean;
}

export function CharacterCard({
  character,
  onUpdate,
  onRegenerate,
  isGenerating = false,
}: CharacterCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleRegenerate = () => {
    if (feedback.trim()) {
      onRegenerate(character.id, feedback);
      setFeedback('');
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "comic-panel group transition-all duration-300",
        isGenerating && "animate-pulse"
      )}
    >
      {/* Character Image */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {character.image_url ? (
          <img
            src={character.image_url}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted-foreground/10 to-muted animate-pulse" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground font-medium">Generating image...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        
        {character.is_main && (
          <Badge className="absolute top-2 left-2 bg-comic-yellow text-black">
            <Star className="w-3 h-3 mr-1" />
            Main
          </Badge>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Character Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-comic text-lg text-primary">{character.name}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {character.description || 'No description yet'}
        </p>

        {/* Edit/Feedback Section */}
        {isEditing && (
          <div className="space-y-2 pt-2 border-t border-border animate-fade-in">
            <Textarea
              placeholder="Describe changes you'd like (e.g., 'Make the character older', 'Add a scar on the face')"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px] text-sm bg-muted/50"
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
                variant="glow"
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
  );
}
