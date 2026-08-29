import { useState, useRef, useCallback } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle, Image, FileText, File } from 'lucide-react';
import { useUpload } from '../context/UploadContext';
import { formatBytes } from '../utils/format';

interface UploadZoneProps {
  onUpload: (file: File, folderId?: string) => Promise<void>;
  folderId?: string;
  disabled?: boolean;
}

export function UploadZone({ onUpload, folderId, disabled }: UploadZoneProps) {
  const { addUpload, updateProgress, completeUpload, errorUpload, removeUpload, uploads } = useUpload();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [disabled]);

  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    await processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      const fileId = addUpload(file);
      setPreviewFiles(prev => [...prev, file]);
      try {
        const progressEvent = new CustomEvent('upload-progress', { detail: { fileId, progress: 0 } });
        window.dispatchEvent(progressEvent);

        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) formData.append('folderId', folderId);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded * 100) / e.total);
            updateProgress(fileId, progress);
            const event = new CustomEvent('upload-progress', { detail: { fileId, progress } });
            window.dispatchEvent(event);
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.open('POST', `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/files/upload`, true);
          const token = localStorage.getItem('token');
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              completeUpload(fileId);
              resolve();
            } else {
              errorUpload(fileId, `Upload failed: ${xhr.statusText}`);
              reject(new Error(xhr.statusText));
            }
          };
          xhr.onerror = () => {
            errorUpload(fileId, 'Network error');
            reject(new Error('Network error'));
          };
          xhr.send(formData);
        });

        await onUpload(file, folderId);
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setTimeout(() => removeUpload(fileId), 3000);
      }
    }
  };

  const openFileDialog = () => fileInputRef.current?.click();

  if (previewFiles.length === 0 && uploads.filter(u => u.status !== 'completed').length === 0) {
    return (
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openFileDialog(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <Upload className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-gray-700 font-medium">Drag & drop files here, or click to browse</p>
        <p className="text-sm text-gray-500 mt-1">Maximum file size: 5GB per file</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {previewFiles.map((file, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <FileIcon file={file} className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
          </div>
          <button
            onClick={() => {
              setPreviewFiles(prev => prev.filter((_, i) => i !== index));
            }}
            className="p-1 text-gray-400 hover:text-red-500 rounded"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      {uploads.filter(u => u.status !== 'completed').map(upload => (
        <div key={upload.fileId} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            {upload.status === 'uploading' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
            {upload.status === 'pending' && <Upload className="w-5 h-5 text-blue-600" />}
            {upload.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {upload.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{upload.fileName}</p>
            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  upload.status === 'error' ? 'bg-red-500' : upload.status === 'completed' ? 'bg-green-500' : 'bg-blue-600'
                }`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            {upload.status === 'error' && (
              <p className="text-xs text-red-500 mt-1">{upload.error}</p>
            )}
          </div>
          {upload.status === 'completed' && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
        </div>
      ))}
    </div>
  );
}

function FileIcon({ file, className }: { file: File; className?: string }) {
  if (file.type.startsWith('image/')) return <Image className={className} />;
  if (file.type === 'application/pdf') return <FileText className={className} />;
  if (file.type.startsWith('text/')) return <FileText className={className} />;
  return <File className={className} />;
}