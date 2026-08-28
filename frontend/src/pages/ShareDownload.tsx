import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Clock, AlertCircle, FileText, Image, File } from 'lucide-react';
import { sharesApi } from '../api/client';
import { formatBytes } from '../utils/format';

export default function ShareDownload() {
  const { token } = useParams<{ token: string }>();
  const [file, setFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchFileInfo();
  }, [token]);

  const fetchFileInfo = async () => {
    try {
      const response = await sharesApi.download(token!);
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) filename = match[1].replace(/['"]/g, '');
      }
      setFile({
        name: filename,
        size: response.data.size || 0,
        mimeType: response.headers['content-type'] || 'application/octet-stream',
      });
    } catch (err: any) {
      if (err.response?.status === 404) setError('Share link not found');
      else if (err.response?.status === 410) setError('Share link has expired');
      else setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!token) return;
    setDownloading(true);
    try {
      const response = await sharesApi.download(token);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file?.name || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
      setError('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-12 h-12 text-green-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-12 h-12 text-red-500" />;
    if (mimeType?.startsWith('text/')) return <FileText className="w-12 h-12 text-blue-500" />;
    return <File className="w-12 h-12 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Access File</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Go to PENTACLOUD
          </a>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">File Not Found</h1>
          <p className="text-gray-600">This share link doesn't contain a valid file.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            {getFileIcon(file.mimeType)}
          </div>
          <h1 className="text-xl font-bold text-gray-900 truncate" title={file.name}>{file.name}</h1>
          <p className="text-gray-500 mt-1">{formatBytes(file.size)}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>Ready to download</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {downloading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Preparing...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download File
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          This is a secure share link from PENTACLOUD
        </p>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}