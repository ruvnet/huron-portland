import { motion } from 'framer-motion';

interface NavigationProps {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function Navigation({ onPrev, onNext, isFirst, isLast }: NavigationProps) {
  const btnClass = "absolute top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-xl flex items-center justify-center transition-all backdrop-blur-sm"
    + " border"
    + " text-[hsl(215_15%_55%)] hover:text-white";

  const btnStyle = {
    background: 'hsl(220 20% 10% / 0.6)',
    borderColor: 'hsl(220 15% 18% / 0.5)',
  };

  const btnHoverStyle = {
    background: 'hsl(220 20% 12%)',
    borderColor: 'hsl(185 80% 50% / 0.3)',
    boxShadow: '0 0 20px hsl(185 80% 50% / 0.15)',
  };

  return (
    <>
      {!isFirst && (
        <motion.button
          onClick={onPrev}
          className={`${btnClass} left-4`}
          style={btnStyle}
          whileHover={{ scale: 1.08, ...btnHoverStyle }}
          whileTap={{ scale: 0.92 }}
          aria-label="Previous slide"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </motion.button>
      )}
      {!isLast && (
        <motion.button
          onClick={onNext}
          className={`${btnClass} right-4`}
          style={btnStyle}
          whileHover={{ scale: 1.08, ...btnHoverStyle }}
          whileTap={{ scale: 0.92 }}
          aria-label="Next slide"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </motion.button>
      )}
    </>
  );
}
