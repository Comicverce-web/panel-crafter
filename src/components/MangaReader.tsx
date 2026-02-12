import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, RotateCw } from 'lucide-react';
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
  // Page 0 = cover, pages 1..n = panels
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = panels.length + (coverImageUrl ? 1 : 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 0));

  const isCover = coverImageUrl && currentPage === 0;
  const panelIndex = coverImageUrl ? currentPage - 1 : currentPage;
  const currentPanel = !isCover ? panels[panelIndex] : null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
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
      <div className="flex-1 flex items-center justify-center relative">
        {/* Left arrow */}
        <button
          className={cn(
            "absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white",
            currentPage === 0 && "opacity-30 pointer-events-none"
          )}
          onClick={prevPage}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* Image */}
        <div className="w-full h-full flex items-center justify-center p-16">
          {isCover ? (
            <img
              src={coverImageUrl!}
              alt="Cover"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : currentPanel?.image_url ? (
            <div className="relative max-w-full max-h-full">
              <img
                src={currentPanel.image_url}
                alt={`Panel ${currentPanel.panel_number}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              {currentPanel.dialogue && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                  <div className="bg-white text-black rounded-2xl px-5 py-3 max-w-[80%] text-center font-comic text-lg shadow-lg border-2 border-black">
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
            currentPage === totalPages - 1 && "opacity-30 pointer-events-none"
          )}
          onClick={nextPage}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === currentPage ? "bg-white w-6" : "bg-white/30 hover:bg-white/50"
            )}
            onClick={() => setCurrentPage(i)}
          />
        ))}
      </div>
    </div>
  );
}
