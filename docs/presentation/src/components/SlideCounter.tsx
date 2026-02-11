export function SlideCounter({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 w-20 rounded-full overflow-hidden" style={{ background: 'hsl(220 15% 18% / 0.5)', boxShadow: 'inset 0 0 2px hsl(220 15% 18% / 0.3)' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${(current / total) * 100}%`,
            background: 'linear-gradient(90deg, hsl(185 80% 50%), hsl(142 70% 50%))',
            boxShadow: '0 0 6px hsl(185 80% 50% / 0.5)',
          }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color: 'hsl(215 15% 55%)' }}>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </div>
  );
}
