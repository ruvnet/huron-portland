export function Branding() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, hsl(185 80% 50%), hsl(142 70% 50%))',
            boxShadow: '0 4px 12px hsl(185 80% 50% / 0.3)',
          }}
        >HCG</div>
        <span className="text-sm font-semibold" style={{ color: 'hsl(210 20% 80%)' }}>Agentic Engineering</span>
      </div>
    </div>
  );
}
