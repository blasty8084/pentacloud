import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, X, RotateCcw, RotateCw, ZoomIn, ZoomOut, File as FileIcon } from 'lucide-react';
import { filesApi } from '../api/client';

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

  useEffect(() => {
    if (!fileId) return;
    fetchFile();
  }, [fileId]);

  const fetchFile = async () => {
    try {
      const response = await filesApi.download(fileId!);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
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
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    navigate('/dashboard');
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <X className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Unable to Preview</h1>
          <p className="text-gray-400 mb-6">{error || 'File not found'}</p>
          <button onClick={handleClose} className="text-blue-400 hover:text-blue-300">
            Back to Dashboard
          </button>
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
    <div className="min-h-screen bg-black flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-white font-medium truncate flex-1 px-4">{file.original_name}</h1>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors" aria-label="Download">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 pt-20 overflow-auto">
        {isImage && previewUrl && (
          <div className="relative max-w-full max-h-[80vh]">
            <img
              src={previewUrl}
              alt={file.original_name}
              className="max-w-full max-h-[80vh] object-contain"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        )}

        {isPdf && previewUrl && (
          <div className="w-full max-w-4xl h-[80vh]">
            <iframe
              src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full rounded-lg shadow-xl"
              title={file.original_name}
            />
          </div>
        )}

        {isText && (
          <div className="w-full max-w-3xl h-[80vh] bg-gray-900 rounded-lg shadow-xl p-6 overflow-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
            {textContent ?? 'Loading...'}
          </div>
        )}

        {!isImage && !isPdf && !isText && (
          <div className="text-center text-white">
            <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <FileIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-medium mb-2">Preview Not Available</h2>
            <p className="text-gray-400 mb-6">This file type cannot be previewed in the browser.</p>
            <button onClick={handleDownload} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
              <Download className="w-5 h-5" />
              Download File
            </button>
          </div>
        )}
      </main>

      {isImage && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-gray-800 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            <button onClick={() => setRotation(r => (r - 90) % 360)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors" aria-label="Rotate left">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors" aria-label="Zoom out">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white font-mono text-sm px-3 py-1 bg-gray-800 rounded">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(4, zoom + 0.25))} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors" aria-label="Zoom in">
              <ZoomIn className="w-5 h-5" />
            </button>
            <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors" aria-label="Rotate right">
              <RotateCw className="w-5 h-5" />
            </button>
            <button onClick={() => { setZoom(1); setRotation(0); }} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors" aria-label="Reset">
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

