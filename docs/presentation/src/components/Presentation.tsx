import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { slides } from '@/data/slides';
import { useSlideNavigation } from '@/hooks/useSlideNavigation';
import { useFullscreen } from '@/hooks/useFullscreen';
import { SlideRenderer } from './SlideRenderer';
import { BackgroundCanvas } from '@/backgrounds/BackgroundCanvas';
import { Navigation } from './Navigation';
import { SidePanel } from './SidePanel';
import { FullscreenToggle } from './FullscreenToggle';
import { PdfExport } from './PdfExport';
import { SlideCounter } from './SlideCounter';
import { Branding } from './Branding';

export function Presentation() {
  const { currentSlide, direction, goNext, goPrev, goTo, isFirst, isLast } = useSlideNavigation(slides.length);
  const { ref, isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const slide = slides[currentSlide];

  // T key toggles side panel
  if (typeof window !== 'undefined') {
    window.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) setSidePanelOpen(p => !p);
    };
  }

  return (
    <div ref={ref} className="relative w-screen h-screen overflow-hidden" style={{ background: 'hsl(220 25% 6%)' }}>
      <BackgroundCanvas scene={slide.background} accentColor={slide.accentColor} />

      {/* Ambient glow orbs */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-20 blur-[120px] animate-pulse-slow" style={{ background: 'hsl(185 80% 50%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full opacity-15 blur-[100px] animate-pulse-slow animation-delay-400" style={{ background: 'hsl(142 70% 50%)' }} />
      </div>

      {/* Gradient overlays — vertical + horizontal per brief section 7 */}
      <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-b from-[hsl(220_25%_6%/0.6)] via-transparent to-[hsl(220_25%_6%/0.4)]" />
      <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-r from-[hsl(220_25%_6%/0.3)] via-transparent to-[hsl(220_25%_6%/0.3)]" />

      {/* Floating particles — 3 small circles with animate-float */}
      <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[15%] w-[1.5px] h-[1.5px] rounded-full animate-float" style={{ background: 'hsl(185 80% 50%)', boxShadow: '0 0 4px hsl(185 80% 50% / 0.6)' }} />
        <div className="absolute top-[60%] right-[20%] w-[1px] h-[1px] rounded-full animate-float animation-delay-200" style={{ background: 'hsl(142 70% 50%)', boxShadow: '0 0 4px hsl(142 70% 50% / 0.6)' }} />
        <div className="absolute bottom-[25%] left-[55%] w-[1.5px] h-[1.5px] rounded-full animate-float animation-delay-400" style={{ background: 'hsl(185 80% 50%)', boxShadow: '0 0 4px hsl(185 80% 50% / 0.6)' }} />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 h-[56px] glass-bar border-b" style={{ borderColor: 'hsl(220 15% 18% / 0.3)' }}>
          <Branding />
          <div className="flex items-center gap-3">
            <PdfExport />
            <FullscreenToggle isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
          </div>
        </div>

        {/* Slide content */}
        <div id="slide-content" className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <SlideRenderer key={currentSlide} slide={slide} direction={direction} />
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 h-[36px] glass-bar border-t" style={{ borderColor: 'hsl(220 15% 18% / 0.3)' }}>
          <p className="text-xs truncate max-w-[60%]" style={{ color: 'hsl(215 15% 55%)' }}>{slide.footer}</p>
          <SlideCounter current={currentSlide + 1} total={slides.length} />
        </div>
      </div>

      {/* Progress bar — gradient from primary via accent to primary */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] z-50" style={{ background: 'hsl(220 15% 18% / 0.3)' }}>
        <div
          className="h-full transition-all duration-[350ms] ease-out"
          style={{
            width: `${((currentSlide + 1) / slides.length) * 100}%`,
            background: 'linear-gradient(90deg, hsl(185 80% 50%), hsl(142 70% 50%), hsl(185 80% 50%))',
            boxShadow: '0 0 12px hsl(185 80% 50% / 0.4)',
          }}
        />
      </div>

      <Navigation onPrev={goPrev} onNext={goNext} isFirst={isFirst} isLast={isLast} />

      <SidePanel
        slides={slides}
        currentSlide={currentSlide}
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        onSelect={(i) => { goTo(i); setSidePanelOpen(false); }}
        onToggle={() => setSidePanelOpen(p => !p)}
      />
    </div>
  );
}
