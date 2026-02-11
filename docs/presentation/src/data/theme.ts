export const colors = {
  background: 'hsl(220 25% 6%)',
  card: 'hsl(220 20% 10%)',
  surfaceElevated: 'hsl(220 20% 12%)',
  secondary: 'hsl(220 20% 14%)',
  muted: 'hsl(220 15% 15%)',
  border: 'hsl(220 15% 18%)',
  foreground: 'hsl(210 20% 92%)',
  secondaryFg: 'hsl(210 20% 80%)',
  mutedFg: 'hsl(215 15% 55%)',
  primary: 'hsl(185 80% 50%)',
  accent: 'hsl(142 70% 50%)',
  amber: '#f9a825',
  red: '#f87171',
  pink: '#f472b6',
} as const;

export const fonts = {
  sans: "'Outfit', 'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

const ease = [0.22, 1, 0.36, 1];

export const transitions = {
  fade: {
    initial: { opacity: 0, scale: 0.96, filter: 'blur(4px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.4, ease } },
    exit: { opacity: 0, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.3, ease } },
  },
  slideLeft: {
    initial: (dir: number) => ({
      x: dir > 0 ? '8%' : '-8%',
      opacity: 0,
      scale: 0.96,
      filter: 'blur(4px)',
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.4, ease },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-8%' : '8%',
      opacity: 0,
      scale: 0.96,
      filter: 'blur(4px)',
      transition: { duration: 0.3, ease },
    }),
  },
  zoom: {
    initial: { scale: 0.92, opacity: 0, filter: 'blur(4px)' },
    animate: { scale: 1, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease } },
    exit: { scale: 1.05, opacity: 0, filter: 'blur(4px)', transition: { duration: 0.3, ease } },
  },
} as const;

export const stagger = {
  container: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  },
  item: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  },
} as const;
