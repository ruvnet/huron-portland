interface FullscreenToggleProps { isFullscreen: boolean; onToggle: () => void; }

export function FullscreenToggle({ isFullscreen, onToggle }: FullscreenToggleProps) {
  return (
    <button onClick={onToggle} className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:text-white" style={{ color: 'hsl(215 15% 55%)', background: 'hsl(220 20% 10% / 0.6)', border: '1px solid hsl(220 15% 18% / 0.5)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(185 80% 50% / 0.3)'; e.currentTarget.style.boxShadow = '0 0 12px hsl(185 80% 50% / 0.1)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(220 15% 18% / 0.5)'; e.currentTarget.style.boxShadow = 'none'; }} aria-label="Toggle fullscreen" title="Fullscreen (F)">
      {isFullscreen ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18-5h-3a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3M3 16v3a2 2 0 002 2h3" /></svg>
      )}
    </button>
  );
}
