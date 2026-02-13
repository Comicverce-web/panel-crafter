import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Panel } from '@/types/project';

interface MangaReaderProps {
  coverImageUrl: string | null;
  panels: Panel[];
  title: string;
  onClose: () => void;
}

export function MangaReader({ coverImageUrl, panels, title, onClose }: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const totalPages = panels.length + (coverImageUrl ? 1 : 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.key === 'ArrowRight' || e.key === ' ') && !isAnimating) goToPage('next');
      if (e.key === 'ArrowLeft' && !isAnimating) goToPage('prev');
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, isAnimating]);

  const goToPage = (direction: 'next' | 'prev') => {
    const nextIdx = direction === 'next' ? currentPage + 1 : currentPage - 1;
    if (nextIdx < 0 || nextIdx >= totalPages || isAnimating) return;

    setFlipDirection(direction);
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentPage(nextIdx);
      setFlipDirection(null);
      setIsAnimating(false);
    }, 500);
  };

  const jumpToPage = (idx: number) => {
    if (idx === currentPage || isAnimating) return;
    setFlipDirection(idx > currentPage ? 'next' : 'prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(idx);
      setFlipDirection(null);
      setIsAnimating(false);
    }, 500);
  };

  const isCover = coverImageUrl && currentPage === 0;
  const panelIndex = coverImageUrl ? currentPage - 1 : currentPage;
  const currentPanel = !isCover ? panels[panelIndex] : null;

  const pageAnimClass = flipDirection === 'next'
    ? 'animate-page-turn-next'
    : flipDirection === 'prev'
      ? 'animate-page-turn-prev'
      : 'animate-page-enter';

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white font-comic text-lg truncate">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm">
            {currentPage + 1} / {totalPages}
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:text-white/80">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 flex items-center justify-center relative" style={{ perspective: '1200px' }}>
        {/* Left arrow */}
        <button
          className={cn(
            "absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white",
            (currentPage === 0 || isAnimating) && "opacity-30 pointer-events-none"
          )}
          onClick={() => goToPage('prev')}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* Page with flip animation */}
        <div
          key={currentPage}
          className={cn("w-full h-full flex items-center justify-center p-16", pageAnimClass)}
          style={{ transformOrigin: flipDirection === 'next' ? 'left center' : 'right center' }}
        >
          {isCover ? (
            <img
              src={coverImageUrl!}
              alt="Cover"
              className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_60px_rgba(255,255,255,0.1)]"
            />
          ) : currentPanel?.image_url ? (
            <div className="relative max-w-full max-h-full">
              <img
                src={currentPanel.image_url}
                alt={`Panel ${currentPanel.panel_number}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-[0_0_60px_rgba(255,255,255,0.1)]"
              />
              {currentPanel.dialogue && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                  <div className="bg-white text-black rounded-2xl px-5 py-3 max-w-[80%] text-center font-comic text-lg shadow-lg border-2 border-black animate-fade-in">
                    {currentPanel.dialogue}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/50 text-xl">No image available</div>
          )}
        </div>

        {/* Right arrow */}
        <button
          className={cn(
            "absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white",
            (currentPage === totalPages - 1 || isAnimating) && "opacity-30 pointer-events-none"
          )}
          onClick={() => goToPage('next')}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Page dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i === currentPage ? "bg-white w-6" : "bg-white/30 hover:bg-white/50"
            )}
            onClick={() => jumpToPage(i)}
          />
        ))}
      </div>
    </div>
  );
}
