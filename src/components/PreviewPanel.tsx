import { Download, Loader2, Sparkles, BookOpen, RefreshCw, AlertTriangle, Crown, Megaphone } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { StyleSelector } from '@/components/StyleSelector';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { CharacterCard } from '@/components/CharacterCard';
import { PanelCard } from '@/components/PanelCard';
import { ImageLightbox } from '@/components/ImageLightbox';
import type { ProjectStyle, ProjectStatus, Character, Panel } from '@/types/project';

interface PreviewPanelProps {
  style: ProjectStyle;
  onStyleChange: (style: ProjectStyle) => void;
  status: ProjectStatus;
  onStatusChange: (status: ProjectStatus) => void;
  characters: Character[];
  panels: Panel[];
  onCharacterUpdate: (id: string, updates: Partial<Character>) => void;
  onCharacterRegenerate: (id: string, feedback: string) => void;
  onPanelUpdate: (id: string, updates: Partial<Panel>) => void;
  onPanelRegenerate: (id: string, feedback: string) => void;
  onGenerateCharacters: () => void;
  onConfirmCharacters: () => void;
  onGeneratePanels: () => void;
  onConfirmPanels: () => void;
  onDownload: () => void;
  onGenerateCover: (feedback?: string) => void;
  onOpenReader: () => void;
  isGenerating: boolean;
  storyLength: number;
  coverImageUrl: string | null;
  coverRegenCount: number;
  projectId?: string;
  subscriptionPlan?: string;
}

export function PreviewPanel({
  style,
  onStyleChange,
  status,
  onStatusChange,
  characters,
  panels,
  onCharacterUpdate,
  onCharacterRegenerate,
  onPanelUpdate,
  onPanelRegenerate,
  onGenerateCharacters,
  onConfirmCharacters,
  onGeneratePanels,
  onConfirmPanels,
  onDownload,
  onGenerateCover,
  onOpenReader,
  isGenerating,
  storyLength,
  coverImageUrl,
  coverRegenCount,
  projectId,
  subscriptionPlan = 'free',
}: PreviewPanelProps) {
  const navigate = useNavigate();
  const [coverFeedback, setCoverFeedback] = useState('');
  const [showCoverLightbox, setShowCoverLightbox] = useState(false);
  const [promotionSent, setPromotionSent] = useState(false);
  const [showPromoNotification, setShowPromoNotification] = useState(false);

  const isEligibleForPromotion = subscriptionPlan === 'premium' || subscriptionPlan === 'custom';

  const handlePromotionRequest = async () => {
    if (!projectId || promotionSent) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { error } = await supabase.from('promotion_requests').insert({
        user_id: session.user.id,
        project_id: projectId,
        subscription_plan: subscriptionPlan,
      });
      if (error) {
        if (error.code === '23505') {
          toast.error('Promotion already requested for this project');
        } else {
          throw error;
        }
        return;
      }
      setPromotionSent(true);
      setShowPromoNotification(true);
      setTimeout(() => setShowPromoNotification(false), 5000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send promotion request');
    }
  };
  const maxRegens = 3;
  const regensLeft = maxRegens - coverRegenCount;

  const handleCoverRegenerate = () => {
    onGenerateCover(coverFeedback.trim() || undefined);
    setCoverFeedback('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-comic text-2xl text-gradient-primary">Preview</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/subscription')}
            className="gap-1"
          >
            <Crown className="w-4 h-4" />
            Plans
          </Button>
          <Button
            variant="comic"
            size="lg"
            onClick={onDownload}
            disabled={status !== 'complete' || isGenerating}
            className="gap-2"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress currentStep={status} onStepClick={onStatusChange} />

      {/* Content Area */}
      <div className="flex-1 mt-6 overflow-auto">
        {/* Draft Step */}
        {status === 'draft' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-comic text-xl mb-2">Choose Your Style</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Select whether you want black & white manga-style panels or full-color comic book art.
              </p>
            </div>
            <StyleSelector value={style} onChange={onStyleChange} disabled={isGenerating} />
            <div className="flex justify-center pt-4">
              <Button
                variant="comic"
                size="xl"
                onClick={onGenerateCharacters}
                disabled={storyLength < 50 || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Generating Characters...</>
                ) : (
                  <><Sparkles className="w-5 h-5" />Generate Characters</>
                )}
              </Button>
            </div>
            {storyLength < 50 && (
              <p className="text-center text-sm text-muted-foreground">
                Write at least 50 characters in your story to continue
              </p>
            )}
          </div>
        )}

        {/* Characters Step */}
        {status === 'characters' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="font-comic text-xl mb-2">Your Characters</h3>
              <p className="text-muted-foreground text-sm">
                Review and customize your characters. Click on an image to view fullscreen.
              </p>
            </div>
            {characters.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((char) => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      onUpdate={onCharacterUpdate}
                      onRegenerate={onCharacterRegenerate}
                      isGenerating={isGenerating}
                    />
                  ))}
                </div>
                <div className="flex justify-center pt-4">
                  <Button variant="comic" size="xl" onClick={onConfirmCharacters} disabled={isGenerating} className="gap-2">
                    Confirm All Characters
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}

        {/* Panels Step */}
        {status === 'panels' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="font-comic text-xl mb-2">Comic Panels</h3>
              <p className="text-muted-foreground text-sm">
                Review your panels. Click on an image to view fullscreen.
              </p>
            </div>
            {panels.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {panels.map((panel) => (
                    <PanelCard key={panel.id} panel={panel} onUpdate={onPanelUpdate} onRegenerate={onPanelRegenerate} isGenerating={isGenerating} />
                  ))}
                </div>
                <div className="flex justify-center pt-4">
                  <Button variant="comic" size="xl" onClick={onConfirmPanels} disabled={isGenerating} className="gap-2">
                    Confirm Panels & Add Dialogues
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating panels...</p>
              </div>
            )}
          </div>
        )}

        {/* Dialogues Step */}
        {status === 'dialogues' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="font-comic text-xl mb-2">Add Dialogues</h3>
              <p className="text-muted-foreground text-sm">Add dialogues to bring your panels to life!</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {panels.map((panel) => (
                <PanelCard key={panel.id} panel={panel} onUpdate={onPanelUpdate} onRegenerate={onPanelRegenerate} isGenerating={isGenerating} showDialogueInput />
              ))}
            </div>
            <div className="flex justify-center pt-4">
              <Button
                variant="comic"
                size="xl"
                onClick={() => {
                  onGenerateCover();
                  onStatusChange('cover');
                }}
                disabled={isGenerating}
                className="gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Cover Page
              </Button>
            </div>
          </div>
        )}

        {/* Cover Step */}
        {status === 'cover' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="font-comic text-xl mb-2">Cover Page</h3>
              <p className="text-muted-foreground text-sm">
                Your cover page is being generated. You can make up to <strong>{maxRegens}</strong> changes.
              </p>
            </div>

            {/* Cover image */}
            <div className="flex justify-center">
              {coverImageUrl ? (
                <div
                  className="relative cursor-pointer max-w-sm rounded-xl overflow-hidden shadow-2xl border-4 border-primary/30"
                  onClick={() => setShowCoverLightbox(true)}
                >
                  <img src={coverImageUrl} alt="Cover" className="w-full hover:scale-105 transition-transform duration-300" />
                </div>
              ) : isGenerating ? (
                <div className="w-72 h-96 rounded-xl bg-gradient-to-br from-muted via-muted-foreground/10 to-muted flex flex-col items-center justify-center gap-4 border-4 border-primary/20">
                  <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground font-medium">Generating cover...</span>
                </div>
              ) : (
                <div className="w-72 h-96 rounded-xl bg-muted flex items-center justify-center border-4 border-dashed border-muted-foreground/30">
                  <span className="text-muted-foreground">No cover yet</span>
                </div>
              )}
            </div>

            {/* Regen counter */}
            <div className="text-center">
              {regensLeft > 0 ? (
                <p className="text-sm text-muted-foreground">
                  You can make <strong className="text-primary">{regensLeft}</strong> more change{regensLeft !== 1 ? 's' : ''}
                </p>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  <p>All regeneration attempts used. Use an external AI tool if needed.</p>
                </div>
              )}
            </div>

            {/* Feedback input */}
            {coverImageUrl && regensLeft > 0 && (
              <div className="max-w-lg mx-auto space-y-3">
                <Textarea
                  placeholder="Describe changes for the cover (e.g., 'Make the title bigger', 'Change the background color')"
                  value={coverFeedback}
                  onChange={(e) => setCoverFeedback(e.target.value)}
                  className="min-h-[80px] text-sm bg-muted/50"
                  disabled={isGenerating}
                />
                <Button
                  variant="glow"
                  className="w-full gap-2"
                  onClick={handleCoverRegenerate}
                  disabled={!coverFeedback.trim() || isGenerating}
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Cover ({regensLeft} left)
                </Button>
              </div>
            )}

            {/* Confirm / Finalize */}
            <div className="flex justify-center pt-4">
              <Button
                variant="comic"
                size="xl"
                onClick={() => onStatusChange('complete')}
                disabled={isGenerating}
                className="gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Confirm Book Cover
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {status === 'complete' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="font-comic text-2xl text-gradient-primary mb-2">
                Your {style === 'manga' ? 'Manga' : 'Comic'} is Ready!
              </h3>
              <p className="text-muted-foreground">
                Open the reader to view your creation, or generate more panels to extend your story.
              </p>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <Button variant="comic" size="xl" onClick={onOpenReader} className="gap-2">
                <BookOpen className="w-5 h-5" />
                Open Reader
              </Button>
              <Button variant="comic" size="xl" onClick={onDownload} className="gap-2">
                <Download className="w-5 h-5" />
                Download PDF
              </Button>
              <Button
                variant="glow"
                size="xl"
                onClick={() => onStatusChange('panels')}
                className="gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate More Panels
              </Button>
              {isEligibleForPromotion && !promotionSent && (
                <Button
                  variant="accent"
                  size="xl"
                  onClick={handlePromotionRequest}
                  className="gap-2"
                >
                  <Megaphone className="w-5 h-5" />
                  Request Promotion
                </Button>
              )}
            </div>

            {/* Promotion notification */}
            {showPromoNotification && (
              <div className="fixed top-4 right-4 z-50 bg-success text-success-foreground px-6 py-3 rounded-lg shadow-lg animate-fade-in">
                Your request has been sent.
              </div>
            )}

            {/* Preview thumbnails */}
            {coverImageUrl && (
              <div className="flex justify-center">
                <img src={coverImageUrl} alt="Cover" className="w-40 rounded-lg shadow-lg border-2 border-primary/30" />
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {panels.map((panel) => (
                <PanelCard key={panel.id} panel={panel} onUpdate={onPanelUpdate} onRegenerate={onPanelRegenerate} isGenerating={isGenerating} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showCoverLightbox && coverImageUrl && (
        <ImageLightbox imageUrl={coverImageUrl} alt="Cover Page" onClose={() => setShowCoverLightbox(false)} />
      )}
    </div>
  );
}
