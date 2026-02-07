import { useState, useCallback } from 'react';
import { Upload, X, Tag, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReferenceImage } from '@/types/project';

interface StoryInputProps {
  story: string;
  onStoryChange: (story: string) => void;
  referenceImages: ReferenceImage[];
  onAddImage: (file: File) => void;
  onRemoveImage: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  isGenerating?: boolean;
}

export function StoryInput({
  story,
  onStoryChange,
  referenceImages,
  onAddImage,
  onRemoveImage,
  onUpdateLabel,
  isGenerating = false,
}: StoryInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 h-full">
      {/* Story Input Section */}
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-gradient-primary font-comic">Your Story</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Write your story here. Focus on plot, setting, and action — not dialogue yet.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="In a world where dreams become reality, a young artist discovers a magical paintbrush that brings her creations to life. But when her darkest fears start manifesting in the city streets, she must learn to control her powers before it's too late..."
            className="min-h-[200px] resize-none bg-muted/50 border-border focus:border-primary transition-colors"
            value={story}
            onChange={(e) => onStoryChange(e.target.value)}
            disabled={isGenerating}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-muted-foreground">
              {story.length} characters
            </span>
            <Badge variant="outline" className="text-primary border-primary/50">
              No dialogue needed here
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Reference Images Section */}
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
          {/* Upload Area */}
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
              disabled={isGenerating}
            />
            <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
          </div>

          {/* Image Grid */}
          {referenceImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {referenceImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative comic-panel overflow-hidden"
                >
                  <img
                    src={img.image_url}
                    alt={img.label || 'Reference'}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveImage(img.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>

                  {/* Label section */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    {editingLabelId === img.id ? (
                      <Input
                        autoFocus
                        placeholder="Add label..."
                        defaultValue={img.label || ''}
                        className="h-7 text-xs bg-black/50 border-primary/50"
                        onBlur={(e) => {
                          onUpdateLabel(img.id, e.target.value);
                          setEditingLabelId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateLabel(img.id, e.currentTarget.value);
                            setEditingLabelId(null);
                          }
                        }}
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
