import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, X, RotateCcw, RotateCw, ZoomIn, ZoomOut, File as FileIcon, Image, FileText, FileVideo, FileAudio, FileArchive } from 'lucide-react';
import { filesApi } from '../api/client';
import { Button } from '../components/Button';
import { formatBytes } from '../utils/format';

export default function FilePreview() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<{
    id: string;
    name: string;
    original_name: string;
    mime_type: string;
    size: number;
    b2_account_id: string;
    b2_file_name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    fetchFile();
  }, [fileId]);

  const fetchFile = async () => {
    try {
      const response = await filesApi.download(fileId!);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      
      if (previewUrlRef.current && previewUrlRef.current !== url) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      previewUrlRef.current = url;
      setPreviewUrl(url);

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'file';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) filename = match[1].replace(/['"]/g, '');
      }

      const contentType = Array.isArray(response.headers['content-type'])
        ? response.headers['content-type'][0]
        : response.headers['content-type'];
      setFile({
        id: fileId!,
        name: filename,
        original_name: filename,
        mime_type: (contentType as string) || 'application/octet-stream',
        size: response.data.size || 0,
        b2_account_id: '',
        b2_file_name: '',
      });
    } catch (err) {
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fileId) return;
    try {
      const response = await filesApi.download(fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file?.original_name || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleClose = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    navigate('/dashboard');
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (mimeType === 'application/pdf') return <FileText className="w-6 h-6" />;
    if (mimeType?.startsWith('video/')) return <FileVideo className="w-6 h-6" />;
    if (mimeType?.startsWith('audio/')) return <FileAudio className="w-6 h-6" />;
    if (mimeType?.startsWith('text/')) return <FileText className="w-6 h-6" />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('7z') || mimeType?.includes('tar') || mimeType?.includes('gzip')) return <FileArchive className="w-6 h-6" />;
    return <FileIcon className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary" />
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-primary px-4">
        <div className="text-center">
          <X className="w-16 h-16 mx-auto mb-4 text-accent-danger" />
          <h1 className="text-2xl font-bold mb-2">Unable to Preview</h1>
          <p className="text-text-secondary mb-6">{error || 'File not found'}</p>
          <Button variant="ghost" onClick={handleClose}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isImage = file.mime_type.startsWith('image/');
  const isPdf = file.mime_type === 'application/pdf';
  const isText = file.mime_type.startsWith('text/');
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (isText && previewUrl) {
      fetch(previewUrl)
        .then(r => r.text())
        .then(setTextContent)
        .catch(() => setTextContent('Unable to display text content'));
    }
  }, [isText, previewUrl]);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[56px] bg-surface/95 backdrop-blur-xl border-b border-surface-border md:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <button onClick={handleClose} className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-base font-medium truncate flex-1 px-4 text-text-primary">{file.original_name}</h1>
          <Button variant="ghost" size="sm" onClick={handleDownload} aria-label="Download">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:fixed md:top-0 md:left-0 md:right-0 z-50 h-[64px] bg-surface/95 backdrop-blur-xl border-b border-surface-border">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <button onClick={handleClose} className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium truncate flex-1 px-4 text-text-primary">{file.original_name}</h1>
          <Button variant="ghost" onClick={handleDownload} aria-label="Download">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 pt-[72px] md:pt-[80px] pb-[80px] overflow-auto">
        {isImage && previewUrl && (
          <div className="relative max-w-full max-h-[85vh]">
            <img
              src={previewUrl}
              alt={file.original_name}
              className="max-w-full max-h-[85vh] object-contain"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        )}

        {isPdf && previewUrl && (
          <div className="w-full max-w-4xl h-[85vh]">
            <iframe
              src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full rounded-xl shadow-xl"
              title={file.original_name}
            />
          </div>
        )}

        {isText && (
          <div className="w-full max-w-3xl h-[85vh] bg-surface-tertiary rounded-xl shadow-xl p-6 overflow-auto font-mono text-sm text-text-secondary whitespace-pre-wrap">
            {textContent ?? 'Loading...'}
          </div>
        )}

        {!isImage && !isPdf && !isText && (
          <div className="text-center text-text-primary w-full max-w-md mx-auto">
            <div className="w-20 h-20 rounded-xl bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
              {getFileIcon(file.mime_type)}
            </div>
            <h2 className="text-xl font-medium mb-2">Preview Not Available</h2>
            <p className="text-text-secondary mb-6">This file type cannot be previewed in the browser.</p>
            <Button onClick={handleDownload} size="lg" className="w-full sm:w-auto">
              <Download className="w-5 h-5" />
              Download File
            </Button>
          </div>
        )}
      </main>

      {/* Mobile Image Controls */}
      {isImage && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-surface-border p-3 md:hidden pb-safe">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setRotation(r => (r - 90) % 360)} aria-label="Rotate left">
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} aria-label="Zoom out">
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-sm font-mono px-3 py-1 bg-surface-tertiary rounded-lg text-text-primary">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(4, zoom + 0.25))} aria-label="Zoom in">
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRotation(r => (r + 90) % 360)} aria-label="Rotate right">
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setZoom(1); setRotation(0); }} aria-label="Reset">
              <RotateCw className="w-5 h-5" />
            </Button>
          </div>
        </footer>
      )}

      {/* Desktop Image Controls */}
      {isImage && (
        <footer className="hidden md:fixed md:bottom-0 md:left-0 md:right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-surface-border p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            <Button variant="ghost" onClick={() => setRotation(r => (r - 90) % 360)} aria-label="Rotate left">
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} aria-label="Zoom out">
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-sm font-mono px-3 py-1 bg-surface-tertiary rounded-lg text-text-primary">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" onClick={() => setZoom(Math.min(4, zoom + 0.25))} aria-label="Zoom in">
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={() => setRotation(r => (r + 90) % 360)} aria-label="Rotate right">
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={() => { setZoom(1); setRotation(0); }} aria-label="Reset">
              <RotateCw className="w-5 h-5" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}