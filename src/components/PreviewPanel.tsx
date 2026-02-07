import { Download, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StyleSelector } from '@/components/StyleSelector';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { CharacterCard } from '@/components/CharacterCard';
import { PanelCard } from '@/components/PanelCard';
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
  isGenerating: boolean;
  storyLength: number;
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
  isGenerating,
  storyLength,
}: PreviewPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-comic text-2xl text-gradient-primary">Preview</h2>
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

      {/* Workflow Progress */}
      <WorkflowProgress currentStep={status} onStepClick={onStatusChange} />

      {/* Content Area */}
      <div className="flex-1 mt-6 overflow-auto">
        {/* Draft Step - Style Selection */}
        {status === 'draft' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-comic text-xl mb-2">Choose Your Style</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Select whether you want black & white manga-style panels or full-color comic book art.
              </p>
            </div>

            <StyleSelector
              value={style}
              onChange={onStyleChange}
              disabled={isGenerating}
            />

            <div className="flex justify-center pt-4">
              <Button
                variant="comic"
                size="xl"
                onClick={onGenerateCharacters}
                disabled={storyLength < 50 || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Characters...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Characters
                  </>
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
                Review and customize your characters. Click edit to provide feedback for regeneration.
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
                  <Button
                    variant="comic"
                    size="xl"
                    onClick={onConfirmCharacters}
                    disabled={isGenerating}
                    className="gap-2"
                  >
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
                Review your panels. Edit any that don't match your vision.
              </p>
            </div>

            {panels.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {panels.map((panel) => (
                    <PanelCard
                      key={panel.id}
                      panel={panel}
                      onUpdate={onPanelUpdate}
                      onRegenerate={onPanelRegenerate}
                      isGenerating={isGenerating}
                    />
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    variant="comic"
                    size="xl"
                    onClick={onConfirmPanels}
                    disabled={isGenerating}
                    className="gap-2"
                  >
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
              <p className="text-muted-foreground text-sm">
                Now add dialogues to bring your panels to life!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {panels.map((panel) => (
                <PanelCard
                  key={panel.id}
                  panel={panel}
                  onUpdate={onPanelUpdate}
                  onRegenerate={onPanelRegenerate}
                  isGenerating={isGenerating}
                  showDialogueInput
                />
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Button
                variant="comic"
                size="xl"
                onClick={() => onStatusChange('complete')}
                disabled={isGenerating}
                className="gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Finish Comic
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
                Your Comic is Ready!
              </h3>
              <p className="text-muted-foreground">
                Download your {style === 'manga' ? 'manga' : 'comic book'} as a PDF.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {panels.map((panel) => (
                <PanelCard
                  key={panel.id}
                  panel={panel}
                  onUpdate={onPanelUpdate}
                  onRegenerate={onPanelRegenerate}
                  isGenerating={isGenerating}
                />
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Button
                variant="comic"
                size="xl"
                onClick={onDownload}
                className="gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
