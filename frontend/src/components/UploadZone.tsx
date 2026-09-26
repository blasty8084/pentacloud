import { useState, useRef, useCallback } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle, Image, FileText, File, ArrowUpTray } from 'lucide-react';
import { useUpload } from '../context/UploadContext';
import { formatBytes } from '../utils/format';
import { Button } from './Button';

interface UploadZoneProps {
  onUpload: (file: File, folderId?: string, onProgress?: (percent: number) => void) => Promise<void>;
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
        await onUpload(file, folderId, (percent) => {
          updateProgress(fileId, percent);
        });
        completeUpload(fileId);
      } catch (err: any) {
        console.error('Upload error:', err);
        errorUpload(fileId, err.response?.data?.error || 'Upload failed');
      } finally {
        setTimeout(() => removeUpload(fileId), 3000);
      }
    }
  };

  const openFileDialog = () => fileInputRef.current?.click();

  if (previewFiles.length === 0 && uploads.filter(u => u.status !== 'completed').length === 0) {
    return (
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer relative overflow-hidden ${
          isDragOver
            ? 'border-accent-primary bg-accent-primary-light/20'
            : 'border-surface-border hover:border-accent-primary/50 hover:bg-surface-secondary/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFileDialog(); } }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        
        {/* Background pattern when dragging */}
        {isDragOver && (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-primary/5 pointer-events-none" />
        )}
        
        <div className="relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-accent-primary-light flex items-center justify-center mb-4 animate-pulse">
            <ArrowUpTray className="w-8 h-8 text-accent-primary" />
          </div>
          <p className="text-text-primary font-medium text-lg mb-1">Drag & drop files here, or click to browse</p>
          <p className="text-sm text-text-tertiary mt-1">Maximum file size: 5GB per file</p>
          
          <div className="mt-4 pt-4 border-t border-surface-border">
            <p className="text-xs text-text-tertiary">Supports: Images, PDFs, Videos, Audio, Documents, Archives, Code</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {previewFiles.map((file, index) => (
        <div key={index} className="card p-3 flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center flex-shrink-0">
            <FileIcon file={file} className="w-6 h-6 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
            <p className="text-xs text-text-tertiary">{formatBytes(file.size)}</p>
          </div>
          <button
            onClick={() => {
              setPreviewFiles(prev => prev.filter((_, i) => i !== index));
            }}
            className="p-1.5 rounded-xl text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      {uploads.filter(u => u.status !== 'completed').map(upload => (
        <div key={upload.fileId} className="card p-3 animate-slide-up">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
            {upload.status === 'uploading' && <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />}
            {upload.status === 'pending' && <Upload className="w-5 h-5 text-accent-primary" />}
            {upload.status === 'error' && <span className="w-5 h-5 text-accent-danger animate-pulse">!</span>}
            {upload.status === 'completed' && <span className="w-5 h-5 text-accent-success">✓</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{upload.fileName}</p>
            <div className="w-full h-1.5 bg-surface-tertiary rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  upload.status === 'error' ? 'bg-accent-danger' : upload.status === 'completed' ? 'bg-accent-success' : 'bg-accent-primary'
                }`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            {upload.status === 'error' && (
              <p className="text-xs text-accent-danger mt-1">{upload.error}</p>
            )}
          </div>
          {upload.status === 'completed' && (
            <span className="w-5 h-5 text-accent-success">✓</span>
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
  if (file.type.startsWith('video/')) return <FileText className={className} />;
  if (file.type.startsWith('audio/')) return <FileText className={className} />;
  return <File className={className} />;
}