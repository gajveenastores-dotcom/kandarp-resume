import { useState, useCallback } from 'react';
import { resumeDownload } from '../content/resumeDownload';

export default function DownloadResume() {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [{ pdf }, { default: ResumeDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ResumeDocument'),
      ]);
      const blob = await pdf(<ResumeDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resumeDownload.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Resume PDF generation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <button
      type="button"
      className="download-btn"
      onClick={handleDownload}
      disabled={loading}
      aria-label="Download resume as PDF"
    >
      <span className="download-btn-icon" aria-hidden>
        ↓
      </span>
      <span>{loading ? 'Preparing…' : 'Download resume'}</span>
    </button>
  );
}
