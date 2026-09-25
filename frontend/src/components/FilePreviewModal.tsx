import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  X, Download, RotateCcw, RotateCw, ZoomIn, ZoomOut, 
  File as FileIcon, FileText, Image, Video, Music, 
  Code, ChevronLeft, ChevronRight, AlertCircle, Loader2 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { filesApi } from '../api/client';
import { formatBytes } from '../utils/format';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FilePreviewModalProps {
  file: {
    id: string;
    name: string;
    original_name: string;
    mime_type: string;
    size: number;
    created_at: number;
  } | null;
  filesList: {
    id: string;
    name: string;
    original_name: string;
    mime_type: string;
    size: number;
    created_at: number;
  }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onDownload: (fileId: string) => Promise<void>;
  isOpen: boolean;
}

export function FilePreviewModal({
  file,
  filesList,
  currentIndex,
  onClose,
  onNavigate,
  onDownload,
  isOpen,
}: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [markdownHtml, setMarkdownHtml] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const fileType = useRef<'image' | 'pdf' | 'video' | 'audio' | 'text' | 'markdown' | 'csv' | 'code' | 'office' | 'archive' | 'unknown'>('unknown');

  useEffect(() => {
    if (!isOpen || !file) return;

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }

      try {
        const response = await filesApi.download(file.id);
        const blob = new Blob([response.data]);
        const url = URL.createObjectURL(blob);
        prevUrlRef.current = url;
        setPreviewUrl(url);

        const contentType = Array.isArray(response.headers['content-type'])
          ? response.headers['content-type'][0]
          : response.headers['content-type'];
        
        const mimeType = (contentType as string) || file.mime_type || 'application/octet-stream';
        determineFileType(mimeType, file.name);

        if (fileType.current === 'text' || fileType.current === 'markdown' || fileType.current === 'csv' || fileType.current === 'code') {
          const blob = response.data as Blob;
          const text: string = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(blob);
          });
          setTextContent(text);
          
          if (fileType.current === 'markdown') {
            const { marked } = await import('marked');
            setMarkdownHtml(marked.parse(text) as string);
          }
          
          if (fileType.current === 'csv') {
            parseCsv(text);
          }
        } else if (fileType.current === 'pdf') {
          await loadPdf(url);
        }
      } catch (err) {
        console.error('Preview load error:', err);
        setError('Failed to load file preview');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
      cleanupPdf();
    };
  }, [isOpen, file?.id]);

  const determineFileType = (mimeType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) {
      fileType.current = 'image';
    } else if (mimeType === 'application/pdf') {
      fileType.current = 'pdf';
    } else if (mimeType.startsWith('video/')) {
      fileType.current = 'video';
    } else if (mimeType.startsWith('audio/')) {
      fileType.current = 'audio';
    } else if (mimeType.startsWith('text/') || ['md', 'json', 'csv', 'log', 'js', 'ts', 'py', 'html', 'css', 'xml', 'yaml', 'sql', 'sh', 'rs', 'go', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'pl', 'swift', 'kt', 'scala', 'clj', 'hs', 'ml', 'fs', 'vb', 'cs', 'dart', 'lua', 'r', 'm', 'mm', 'txt'].includes(ext)) {
      if (ext === 'md' || ext === 'markdown') {
        fileType.current = 'markdown';
      } else if (ext === 'csv') {
        fileType.current = 'csv';
      } else {
        fileType.current = 'code';
      }
    } else if (['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'].includes(ext)) {
      fileType.current = 'office';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      fileType.current = 'archive';
    } else {
      fileType.current = 'unknown';
    }
  };

  const parseCsv = (text: string) => {
    const lines = text.trim().split('\n');
    const data = lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    });
    setCsvData(data);
  };

  const loadPdf = async (url: string) => {
    try {
      const loadingTask = pdfjsLib.getDocument({ url });
      const pdfDoc = await loadingTask.promise;
      pdfDocRef.current = pdfDoc;
      setPdfNumPages(pdfDoc.numPages);
      setPdfPage(1);
      await renderPdfPage(1);
    } catch (err) {
      console.error('PDF load error:', err);
      setError('Failed to load PDF');
    }
  };

  const renderPdfPage = async (pageNum: number) => {
    if (!pdfDocRef.current) return;
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderContext = {
        canvasContext: context!,
        viewport: viewport,
        canvas: canvas, // Required in newer pdf.js versions
      };
      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);
      setPdfPage(pageNum);
    } catch (err) {
      console.error('PDF render error:', err);
    }
  };

  const cleanupPdf = () => {
    if (pdfDocRef.current) {
      pdfDocRef.current.cleanup();
      pdfDocRef.current = null;
    }
  };

  const handleDownload = async () => {
    if (file) await onDownload(file.id);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate('prev');
    if (e.key === 'ArrowRight' && currentIndex < filesList.length - 1) onNavigate('next');
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, filesList.length]);

  if (!isOpen || !file) return null;

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        </div>
      );
    }

    if (error || !previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-400">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">Unable to Preview</h2>
          <p className="mb-4">{error || 'File type not supported for preview'}</p>
          <button 
            onClick={handleDownload}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download File
          </button>
        </div>
      );
    }

    switch (fileType.current) {
      case 'image':
        return (
          <div className="relative max-w-full max-h-[70vh] flex items-center justify-center">
            <img
              src={previewUrl}
              alt={file.original_name}
              className="max-w-full max-h-[70vh] object-contain"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full max-w-4xl h-[70vh] flex flex-col">
            <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={previewUrl}
                alt={`Page ${pdfPage} of ${pdfNumPages}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 p-4">
              <button 
                onClick={() => renderPdfPage(pdfPage - 1)}
                disabled={pdfPage <= 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white font-mono text-sm px-3 py-1 bg-gray-800 rounded">
                Page {pdfPage} of {pdfNumPages}
              </span>
              <button 
                onClick={() => renderPdfPage(pdfPage + 1)}
                disabled={pdfPage >= pdfNumPages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="w-full max-w-4xl h-[70vh]">
            <video
              src={previewUrl}
              controls
              className="w-full h-full max-h-[70vh] rounded-lg shadow-xl"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="w-full max-w-md">
            <audio
              src={previewUrl}
              controls
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
            <div className="text-center text-gray-400 mt-4 text-sm">
              {fileType.current === 'audio' && (
                <span>Audio preview - {file.mime_type}</span>
              )}
            </div>
          </div>
        );

      case 'markdown':
        if (showRawMarkdown) {
          return (
            <div className="w-full max-w-3xl h-[70vh] bg-gray-900 rounded-lg shadow-xl p-6 overflow-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
              {textContent ?? 'Loading...'}
            </div>
          );
        }
        return (
          <div 
            className="w-full max-w-3xl h-[70vh] bg-white rounded-lg shadow-xl p-8 overflow-auto prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownHtml || '' }}
          />
        );

      case 'csv':
        if (!csvData || csvData.length === 0) {
          return (
            <div className="w-full max-w-3xl h-[70vh] bg-gray-900 rounded-lg shadow-xl p-6 overflow-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
              {textContent ?? 'Loading...'}
            </div>
          );
        }
        return (
          <div className="w-full max-w-4xl h-[70vh] bg-gray-900 rounded-lg shadow-xl overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-800">
                <tr>
                  {csvData[0].map((cell, i) => (
                    <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">
                      {cell || `Column ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-800/50' : ''}>
                    {row.map((cell, i) => (
                      <td key={i} className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700/50 whitespace-nowrap max-w-xs truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'code':
      case 'text':
        return (
          <div className="w-full max-w-3xl h-[70vh] bg-gray-900 rounded-lg shadow-xl p-6 overflow-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
            <pre><code>{textContent ?? 'Loading...'}</code></pre>
          </div>
        );

      case 'office':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-400">
            <FileText className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Office Document Preview</h2>
            <p className="mb-6 max-w-md">
              Preview for Office documents (docx, xlsx, pptx) requires Microsoft Office Online viewer 
              which needs a publicly accessible URL. Your file is stored privately in B2.
            </p>
            <button 
              onClick={handleDownload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download to View
            </button>
          </div>
        );

      case 'archive':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-400">
            <FileIcon className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Archive File</h2>
            <p className="mb-6">Archive contents cannot be previewed directly.</p>
            <button 
              onClick={handleDownload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Archive
            </button>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-400">
            <FileIcon className="w-16 h-16 text-gray-500 mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Preview Not Available</h2>
            <p className="mb-6">This file type cannot be previewed in the browser.</p>
            <button 
              onClick={handleDownload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download File
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-800" onClick={(e) => e.stopPropagation()}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-white font-medium truncate px-4 max-w-2xl">{file.original_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors" aria-label="Download">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 pt-20 overflow-auto" onClick={(e) => e.stopPropagation()}>
        {renderPreview()}
      </main>

      {fileType.current === 'image' && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-gray-800 p-4" onClick={(e) => e.stopPropagation()}>
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

      {fileType.current === 'markdown' && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-gray-800 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="max-w-3xl mx-auto flex items-center justify-center">
            <button 
              onClick={() => setShowRawMarkdown(!showRawMarkdown)}
              className="px-4 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              {showRawMarkdown ? 'Rendered' : 'Raw'} View
            </button>
          </div>
        </footer>
      )}

      <footer className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-4 pointer-events-none" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => onNavigate('prev')}
          disabled={currentIndex <= 0}
          className="pointer-events-auto p-3 bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous file"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="pointer-events-auto text-white text-sm bg-gray-900/80 px-4 py-2 rounded-full">
          {currentIndex + 1} / {filesList.length}
        </span>
        <button 
          onClick={() => onNavigate('next')}
          disabled={currentIndex >= filesList.length - 1}
          className="pointer-events-auto p-3 bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next file"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
}