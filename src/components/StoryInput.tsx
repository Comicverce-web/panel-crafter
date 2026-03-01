import { useState, useCallback } from 'react';
import { Upload, X, Tag, BookOpen, Users, Palette, MapPin, MessageSquare, Hash, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ReferenceImage, CharacterDescription } from '@/types/project';

interface StoryInputProps {
  title: string;
  onTitleChange: (title: string) => void;
  genre: string;
  onGenreChange: (genre: string) => void;
  story: string;
  onStoryChange: (story: string) => void;
  numPages: number;
  onNumPagesChange: (num: number) => void;
  pageStorylines: string[];
  onPageStorylinesChange: (storylines: string[]) => void;
  characterDescriptions: CharacterDescription[];
  onCharacterDescriptionsChange: (chars: CharacterDescription[]) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  settings: string;
  onSettingsChange: (settings: string) => void;
  recommendations: string;
  onRecommendationsChange: (recommendations: string) => void;
  referenceImages: ReferenceImage[];
  onAddImage: (file: File) => void;
  onRemoveImage: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

export function StoryInput({
  title,
  onTitleChange,
  genre,
  onGenreChange,
  story,
  onStoryChange,
  numPages,
  onNumPagesChange,
  pageStorylines,
  onPageStorylinesChange,
  characterDescriptions,
  onCharacterDescriptionsChange,
  theme,
  onThemeChange,
  settings,
  onSettingsChange,
  recommendations,
  onRecommendationsChange,
  referenceImages,
  onAddImage,
  onRemoveImage,
  onUpdateLabel,
  isGenerating = false,
  disabled = false,
}: StoryInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [numCharsInput, setNumCharsInput] = useState(characterDescriptions.length.toString());

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          onAddImage(file);
        }
      });
    }
  }, [onAddImage]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          onAddImage(file);
        }
      });
    }
  }, [onAddImage]);

  const handleNumPagesChange = (value: string) => {
    const num = parseInt(value);
    onNumPagesChange(num);
    const newStorylines = [...pageStorylines];
    if (num > newStorylines.length) {
      for (let i = newStorylines.length; i < num; i++) {
        newStorylines.push('');
      }
    } else {
      newStorylines.length = num;
    }
    onPageStorylinesChange(newStorylines);
  };

  const handlePageStorylineChange = (index: number, value: string) => {
    const newStorylines = [...pageStorylines];
    newStorylines[index] = value;
    onPageStorylinesChange(newStorylines);
  };

  const handleNumCharsChange = (value: string) => {
    setNumCharsInput(value);
    const num = parseInt(value);
    if (isNaN(num) || num < 0) return;
    const newChars = [...characterDescriptions];
    if (num > newChars.length) {
      for (let i = newChars.length; i < num; i++) {
        newChars.push({ name: '', description: '' });
      }
    } else {
      newChars.length = num;
    }
    onCharacterDescriptionsChange(newChars);
  };

  const handleCharDescChange = (index: number, field: 'name' | 'description', value: string) => {
    const newChars = [...characterDescriptions];
    newChars[index] = { ...newChars[index], [field]: value };
    onCharacterDescriptionsChange(newChars);
  };

  const isDisabled = disabled || isGenerating;

  return (
    <div className="space-y-6 h-full">
      {/* Title */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-gradient-primary font-comic">Title</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Enter your manga/comic title..."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={isDisabled}
            className="bg-muted/50 border-border focus:border-primary"
          />
        </CardContent>
      </Card>

      {/* Genre */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-primary" />
            <span className="text-gradient-primary font-comic">Genre</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Funny, Thriller, Romance, Action, Horror..."
            value={genre}
            onChange={(e) => onGenreChange(e.target.value)}
            disabled={isDisabled}
            className="bg-muted/50 border-border focus:border-primary"
          />
        </CardContent>
      </Card>

      {/* Generalized Storyline */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-gradient-primary font-comic">Storyline</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Write the overall storyline. Focus on plot, setting, and action.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="In a world where dreams become reality, a young artist discovers a magical paintbrush..."
            className="min-h-[120px] resize-none bg-muted/50 border-border focus:border-primary"
            value={story}
            onChange={(e) => onStoryChange(e.target.value)}
            disabled={isDisabled}
          />
          <span className="text-xs text-muted-foreground mt-2 block">{story.length} characters</span>
        </CardContent>
      </Card>

      {/* Number of Pages + Per-page Storylines */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="w-5 h-5 text-primary" />
            <span className="text-gradient-primary font-comic">Pages</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose the number of pages and describe each page's scene.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={numPages.toString()} onValueChange={handleNumPagesChange} disabled={isDisabled}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder="Select number of pages" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} {n === 1 ? 'Page' : 'Pages'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {pageStorylines.length > 0 && (
            <div className="space-y-3">
              {pageStorylines.map((storyline, index) => (
                <div key={index}>
                  <Label className="text-sm font-medium text-foreground mb-1 block">
                    Page {index + 1}
                  </Label>
                  <Textarea
                    placeholder={`Describe the scene for page ${index + 1}...`}
                    className="min-h-[80px] resize-none bg-muted/50 border-border focus:border-primary"
                    value={storyline}
                    onChange={(e) => handlePageStorylineChange(index, e.target.value)}
                    disabled={isDisabled}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Characters */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-gradient-primary font-comic">Characters</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the number of characters and describe each one.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            min={0}
            placeholder="Number of characters"
            value={numCharsInput}
            onChange={(e) => handleNumCharsChange(e.target.value)}
            disabled={isDisabled}
            className="bg-muted/50 border-border focus:border-primary w-48"
          />

          {characterDescriptions.length > 0 && (
            <div className="space-y-4">
              {characterDescriptions.map((char, index) => (
                <div key={index} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Character {index + 1}</Label>
                  <Input
                    placeholder="Character name"
                    value={char.name}
                    onChange={(e) => handleCharDescChange(index, 'name', e.target.value)}
                    disabled={isDisabled}
                    className="bg-muted/50 border-border focus:border-primary"
                  />
                  <Textarea
                    placeholder="Character description (appearance, personality, role...)"
                    className="min-h-[60px] resize-none bg-muted/50 border-border focus:border-primary"
                    value={char.description}
                    onChange={(e) => handleCharDescChange(index, 'description', e.target.value)}
                    disabled={isDisabled}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-accent" />
            <span className="text-gradient-accent font-comic">Theme</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Redemption, Coming of age, Good vs Evil..."
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            disabled={isDisabled}
            className="bg-muted/50 border-border focus:border-primary"
          />
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-accent" />
            <span className="text-gradient-accent font-comic">Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe the world, location, time period..."
            className="min-h-[80px] resize-none bg-muted/50 border-border focus:border-primary"
            value={settings}
            onChange={(e) => onSettingsChange(e.target.value)}
            disabled={isDisabled}
          />
        </CardContent>
      </Card>

      {/* Further Recommendations */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-accent" />
            <span className="text-gradient-accent font-comic">Further Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional instructions, art style preferences, or special requests..."
            className="min-h-[80px] resize-none bg-muted/50 border-border focus:border-primary"
            value={recommendations}
            onChange={(e) => onRecommendationsChange(e.target.value)}
            disabled={isDisabled}
          />
        </CardContent>
      </Card>

      {/* Reference Images */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5 text-accent" />
            <span className="text-gradient-accent font-comic">Reference Images</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload images and label them (e.g., "protagonist's room", "villain's lair")
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isDisabled}
            />
            <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
          </div>

          {referenceImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {referenceImages.map((img) => (
                <div key={img.id} className="group relative comic-panel overflow-hidden">
                  <img src={img.image_url} alt={img.label || 'Reference'} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveImage(img.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    {editingLabelId === img.id ? (
                      <Input
                        autoFocus
                        placeholder="Add label..."
                        defaultValue={img.label || ''}
                        className="h-7 text-xs bg-black/50 border-primary/50"
                        onBlur={(e) => { onUpdateLabel(img.id, e.target.value); setEditingLabelId(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateLabel(img.id, e.currentTarget.value); setEditingLabelId(null); } }}
                      />
                    ) : (
                      <button
                        className="flex items-center gap-1 text-xs text-white/80 hover:text-primary transition-colors"
                        onClick={() => setEditingLabelId(img.id)}
                      >
                        <Tag className="w-3 h-3" />
                        {img.label || 'Click to add label'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
