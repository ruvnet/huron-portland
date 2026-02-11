import { usePdfExport } from '@/hooks/usePdfExport';

export function PdfExport() {
  const { exportPdf, isExporting } = usePdfExport();

  return (
    <button onClick={exportPdf} disabled={isExporting} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all disabled:opacity-30 hover:text-white" style={{ color: 'hsl(215 15% 55%)', background: 'hsl(220 20% 10% / 0.6)', border: '1px solid hsl(220 15% 18% / 0.5)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(185 80% 50% / 0.3)'; e.currentTarget.style.boxShadow = '0 0 12px hsl(185 80% 50% / 0.1)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(220 15% 18% / 0.5)'; e.currentTarget.style.boxShadow = 'none'; }} title="Download PDF">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
      {isExporting ? 'Exporting...' : 'PDF'}
    </button>
  );
}
