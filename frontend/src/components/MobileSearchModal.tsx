import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, Image, File, Folder, ChevronRight } from 'lucide-react';
import { filesApi, foldersApi } from '../api/client';
import { formatBytes } from '../utils/format';
import { MobileBottomSheet } from './MobileBottomSheet';
import { Button } from './Button';
import { FileIcon } from './FileIcon';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId?: string | null;
  t: (key: string) => string;
  onNavigate?: (path: string) => void;
}

export function MobileSearchModal({ 
  isOpen, 
  onClose, 
  currentFolderId,
  t,
  onNavigate,
}: MobileSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ files: any[]; folders: any[] }>({ files: [], folders: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ files: [], folders: [] });
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const [filesRes, foldersRes] = await Promise.all([
          filesApi.list({ search: query, folderId: currentFolderId || undefined }),
          foldersApi.list(),
        ]);
        setResults({
          files: Array.isArray(filesRes.data) ? filesRes.data : [],
          folders: Array.isArray(foldersRes.data) 
            ? foldersRes.data.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
            : [],
        });
      } catch (err) {
        console.error('Search failed:', err);
        setResults({ files: [], folders: [] });
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, currentFolderId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.files.length + results.folders.length;
    if (totalItems === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const folderCount = results.folders.length;
      if (selectedIndex < folderCount) {
        const folder = results.folders[selectedIndex];
        if (onNavigate) onNavigate(`/dashboard?folder=${folder.id}`);
        else navigate(`/dashboard?folder=${folder.id}`);
        onClose();
      } else {
        const file = results.files[selectedIndex - folderCount];
        navigate(`/preview/${file.id}`);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('Search')}
      showHandle
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('Search files, folders...')}
            className="input pl-10 pr-10"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
          </div>
        )}

        {!loading && query && results.files.length === 0 && results.folders.length === 0 && (
          <div className="text-center py-8 text-text-tertiary">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No results for "{query}"</p>
          </div>
        )}

        {!loading && query && (results.folders.length > 0 || results.files.length > 0) && (
          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {results.folders.map((folder, index) => (
              <button
                key={`folder-${folder.id}`}
                onClick={() => {
                  if (onNavigate) onNavigate(`/dashboard?folder=${folder.id}`);
                  else navigate(`/dashboard?folder=${folder.id}`);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  selectedIndex === index ? 'bg-accent-primary-light/50' : 'hover:bg-surface-secondary'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-accent-primary-light flex items-center justify-center flex-shrink-0">
                  <Folder className="w-5 h-5 text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{folder.name}</p>
                  <p className="text-xs text-text-tertiary">Folder</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary" />
              </button>
            ))}
            
            {results.folders.length > 0 && results.files.length > 0 && (
              <div className="h-px bg-surface-border my-2" />
            )}

            {results.files.map((file, index) => (
              <button
                key={`file-${file.id}`}
                onClick={() => {
                  navigate(`/preview/${file.id}`);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  selectedIndex === index + results.folders.length ? 'bg-accent-primary-light/50' : 'hover:bg-surface-secondary'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center flex-shrink-0">
                  <FileIcon mimeType={file.mime_type} fileName={file.name} className="w-5 h-5 text-text-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-tertiary flex items-center gap-1">
                    <span>{formatBytes(file.size)}</span>
                    <span>•</span>
                    <span>{file.mime_type}</span>
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary" />
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileBottomSheet>
  );
}