import { useState, useCallback } from 'react';

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportPdf = useCallback(async () => {
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const slideEl = document.getElementById('slide-content');
      if (!slideEl) return;

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1200, 675] });
      const canvas = await html2canvas(slideEl, { scale: 2, backgroundColor: '#1a1a2e', useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', 0, 0, 1200, 675);
      pdf.save('HCG-Agentic-Engineering-Presentation.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, []);

  return { exportPdf, isExporting, progress };
}
