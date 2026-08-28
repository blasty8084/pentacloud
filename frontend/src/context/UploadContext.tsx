import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadContextType {
  uploads: UploadProgress[];
  addUpload: (file: File) => string;
  updateProgress: (fileId: string, progress: number) => void;
  completeUpload: (fileId: string) => void;
  errorUpload: (fileId: string, error: string) => void;
  removeUpload: (fileId: string) => void;
  clearCompleted: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const addUpload = (file: File) => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setUploads(prev => [...prev, {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }]);
    return fileId;
  };

  const updateProgress = (fileId: string, progress: number) => {
    setUploads(prev => prev.map(u =>
      u.fileId === fileId ? { ...u, progress, status: 'uploading' } : u
    ));
  };

  const completeUpload = (fileId: string) => {
    setUploads(prev => prev.map(u =>
      u.fileId === fileId ? { ...u, progress: 100, status: 'completed' } : u
    ));
  };

  const errorUpload = (fileId: string, error: string) => {
    setUploads(prev => prev.map(u =>
      u.fileId === fileId ? { ...u, status: 'error', error } : u
    ));
  };

  const removeUpload = (fileId: string) => {
    setUploads(prev => prev.filter(u => u.fileId !== fileId));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status !== 'completed'));
  };

  return (
    <UploadContext.Provider value={{
      uploads,
      addUpload,
      updateProgress,
      completeUpload,
      errorUpload,
      removeUpload,
      clearCompleted,
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}