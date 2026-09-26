import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Folder, ChevronRight, X, ArrowRightToLine } from 'lucide-react';

interface Item {
  id: string;
  name: string;
}

interface FolderItem {
  id: string;
  name: string;
  parent_id: string | null;
  children?: FolderItem[];
}

interface MoveModalProps {
  item: Item;
  type: 'file' | 'folder';
  folders: FolderItem[];
  currentFolderId: string | null;
  onMove: (id: string, folderId: string | null, type: 'file' | 'folder') => Promise<void>;
  onClose: () => void;
}

export function MoveModal({ item, type, folders, currentFolderId, onMove, onClose }: MoveModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const renderFolderOptions = (items: FolderItem[], depth = 0) => (
    <>
      {items.map(folder => (
        <>
          <button
            key={folder.id}
            onClick={() => {
              if (folder.id !== item.id) setSelectedFolderId(folder.id);
            }}
            disabled={folder.id === item.id}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors rounded-xl ${
              selectedFolderId === folder.id
                ? 'bg-accent-primary-light text-accent-primary font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              } ${folder.id === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {folder.children && folder.children.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedFolders(prev => { const next = new Set(prev); if (next.has(folder.id)) next.delete(folder.id); else next.add(folder.id); return next; }); }}
                className={`p-1 flex-shrink-0 rounded-lg transition-transform ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`}
              >
                <ChevronRight className="w-4 h-4 text-text-tertiary" />
              </button>
            )}
            {folder.children && folder.children.length === 0 && <div className="w-4 h-4 flex-shrink-0" />}
            <Folder className="w-4 h-4 flex-shrink-0 text-text-tertiary" />
            <span className="truncate flex-1">{folder.name}</span>
          </button>
          {expandedFolders.has(folder.id) && folder.children && (
            <div>{renderFolderOptions(folder.children, depth + 1)}</div>
          )}
        </>
      ))}
    </>
  );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onMove(item.id, selectedFolderId, type);
      onClose();
    } catch (err) {
      console.error('Move failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-text-secondary">
          Move <strong className="text-text-primary">{item.name}</strong> to:
        </p>
      </div>

      <div className="card max-h-80 overflow-y-auto p-2">
        <button
          onClick={() => setSelectedFolderId(null)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors rounded-xl ${
            selectedFolderId === null
              ? 'bg-accent-primary-light text-accent-primary font-medium'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Root (All Files)</span>
        </button>
        <div className="mt-1">{renderFolderOptions(folders)}</div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          <ArrowRightToLine className="w-4 h-4" />
          <span>Move Here</span>
        </Button>
      </div>
    </div>
  );
}