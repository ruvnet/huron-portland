import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#1a1a2e',
        'dark-card': '#2d2d44',
        'electric-purple': '#6c63ff',
        'teal': '#4ecdc4',
        'amber': '#f9a825',
        'coral': '#ff6b6b',
        'light-gray': '#e0e0e0',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
