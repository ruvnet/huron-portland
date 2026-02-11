import { useState, useCallback, useEffect, useRef } from 'react';

export function useSlideNavigation(totalSlides: number) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const wheelCooldown = useRef(false);

  const goTo = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(Math.max(0, Math.min(totalSlides - 1, index)));
  }, [currentSlide, totalSlides]);

  const goNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) { setDirection(1); setCurrentSlide(s => s + 1); }
  }, [currentSlide, totalSlides]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) { setDirection(-1); setCurrentSlide(s => s - 1); }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); goTo(totalSlides - 1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, goTo, totalSlides]);

  // Scroll wheel navigation (debounced)
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelCooldown.current) return;
      if (Math.abs(e.deltaY) < 10) return; // ignore tiny trackpad noise
      wheelCooldown.current = true;
      if (e.deltaY > 0) goNext();
      else goPrev();
      setTimeout(() => { wheelCooldown.current = false; }, 400);
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, [goNext, goPrev]);

  // Touch/swipe
  useEffect(() => {
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -50) goNext();
      else if (dx > 50) goPrev();
    };
    window.addEventListener('touchstart', onStart);
    window.addEventListener('touchend', onEnd);
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, [goNext, goPrev]);

  return { currentSlide, direction, goNext, goPrev, goTo, isFirst: currentSlide === 0, isLast: currentSlide === totalSlides - 1 };
}
