import { cn } from '@/lib/utils';
import type { ProjectStyle } from '@/types/project';

interface StyleSelectorProps {
  value: ProjectStyle;
  onChange: (style: ProjectStyle) => void;
  disabled?: boolean;
}

export function StyleSelector({ value, onChange, disabled }: StyleSelectorProps) {
  return (
    <div className="flex gap-4 p-1 bg-muted/50 rounded-xl">
      <button
        onClick={() => onChange('manga')}
        disabled={disabled}
        className={cn(
          "flex-1 relative overflow-hidden rounded-lg p-4 transition-all duration-300",
          value === 'manga'
            ? "bg-card border-2 border-primary shadow-glow-primary"
            : "bg-transparent border-2 border-transparent hover:bg-card/50"
        )}
      >
        <div className="relative z-10">
          <div className="text-3xl mb-2 grayscale">📖</div>
          <h3 className="font-comic text-xl text-foreground">Manga</h3>
          <p className="text-xs text-muted-foreground mt-1">Black & white style</p>
        </div>
        {value === 'manga' && (
          <div className="absolute inset-0 halftone-overlay opacity-30" />
        )}
      </button>

      <button
        onClick={() => onChange('comic')}
        disabled={disabled}
        className={cn(
          "flex-1 relative overflow-hidden rounded-lg p-4 transition-all duration-300",
          value === 'comic'
            ? "bg-card border-2 border-accent shadow-glow-accent"
            : "bg-transparent border-2 border-transparent hover:bg-card/50"
        )}
      >
        <div className="relative z-10">
          <div className="text-3xl mb-2">💥</div>
          <h3 className="font-comic text-xl text-foreground">Comic</h3>
          <p className="text-xs text-muted-foreground mt-1">Full color panels</p>
        </div>
        {value === 'comic' && (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-secondary/10" />
        )}
      </button>
    </div>
  );
}
