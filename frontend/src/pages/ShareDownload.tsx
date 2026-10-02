import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, AlertCircle, FileText, Image, File, ArrowLeft } from 'lucide-react';
import { sharesApi } from '../api/client';
import { formatBytes } from '../utils/format';
import { Button } from '../components/Button';
import { FileIcon } from '../components/FileIcon';
import { Card } from '../components/Card';

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
      const contentType = Array.isArray(response.headers['content-type'])
        ? response.headers['content-type'][0]
        : response.headers['content-type'];
      setFile({
        name: filename,
        size: response.data.size || 0,
        mimeType: (contentType as string) || 'application/octet-stream',
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
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-accent-danger mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Unable to Access File</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="w-4 h-4" />
            Go to PENTACLOUD
          </Button>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="text-center">
          <File className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">File Not Found</h1>
          <p className="text-text-tertiary">This share link doesn't contain a valid file.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-accent-primary-light flex items-center justify-center mx-auto mb-4">
            <FileIcon mimeType={file.mimeType} fileName={file.name} className="w-12 h-12" />
          </div>
          <h1 className="text-xl font-bold text-text-primary truncate" title={file.name}>{file.name}</h1>
          <p className="text-text-secondary mt-1">{formatBytes(file.size)}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <FileText className="w-4 h-4" />
              <span>Ready to download</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleDownload} 
          disabled={downloading} 
          className="w-full"
          size="lg"
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
        </Button>

        <p className="text-center text-xs text-text-tertiary mt-4">
          This is a secure share link from PENTACLOUD
        </p>
      </Card>
    </div>
  );
}