import { motion, AnimatePresence } from 'framer-motion';
import type { SlideData } from '@/data/slides';

interface SidePanelProps {
  slides: SlideData[];
  currentSlide: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
  onToggle: () => void;
}

export function SidePanel({ slides, currentSlide, isOpen, onClose, onSelect, onToggle }: SidePanelProps) {
  return (
    <>
      {/* Menu toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-4 left-4 z-40 w-8 h-8 flex flex-col justify-center items-center gap-1 transition-colors"
        style={{ color: 'hsl(215 15% 55%)' }}
        aria-label="Toggle slide panel"
      >
        <span className="w-5 h-0.5 bg-current rounded" />
        <span className="w-5 h-0.5 bg-current rounded" />
        <span className="w-5 h-0.5 bg-current rounded" />
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 left-0 z-50 w-[280px] h-full overflow-y-auto"
            style={{
              background: 'hsl(220 25% 6% / 0.95)',
              backdropFilter: 'blur(24px)',
              borderRight: '1px solid hsl(220 15% 18% / 0.5)',
            }}
          >
            {/* Gradient accent stripe */}
            <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, hsl(185 80% 50%), hsl(142 70% 50%), hsl(185 80% 50%))' }} />

            <div className="p-4" style={{ borderBottom: '1px solid hsl(220 15% 18% / 0.3)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(215 15% 55%)' }}>Slides</h3>
            </div>

            <div className="p-2 space-y-1">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => onSelect(i)}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm border"
                  style={i === currentSlide ? {
                    background: 'hsl(185 80% 50% / 0.1)',
                    borderColor: 'hsl(185 80% 50% / 0.2)',
                    color: 'hsl(210 20% 92%)',
                    boxShadow: '0 0 12px hsl(185 80% 50% / 0.1)',
                  } : {
                    background: 'transparent',
                    borderColor: 'transparent',
                    color: 'hsl(215 15% 55%)',
                  }}
                >
                  <span
                    className="text-xs mr-2 font-mono"
                    style={{ color: i === currentSlide ? 'hsl(185 80% 50%)' : 'hsl(220 15% 18%)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {slide.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
