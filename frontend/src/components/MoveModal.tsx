import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Folder, ChevronRight } from 'lucide-react';

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
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
              selectedFolderId === folder.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            } ${folder.id === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {folder.children && folder.children.length > 0 && (
              <ChevronRight
                className={`w-4 h-4 flex-shrink-0 transition-transform ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`}
              />
            )}
            {folder.children && folder.children.length === 0 && <div className="w-4 h-4 flex-shrink-0" />}
            <Folder className="w-4 h-4 flex-shrink-0" />
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
      <p className="text-sm text-gray-600">
        Move <strong>{item.name}</strong> to:
      </p>

      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
        <button
          onClick={() => setSelectedFolderId(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
            selectedFolderId === null
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Root (All Files)</span>
        </button>
        <div className="mt-1">{renderFolderOptions(folders)}</div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          Move Here
        </Button>
      </div>
    </div>
  );
}