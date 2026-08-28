import { useState } from 'react';
import { Folder, ChevronRight, Plus, FolderPlus } from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
  parent_id: string | null;
  children?: FolderItem[];
}

interface FolderSidebarProps {
  folders: FolderItem[];
  currentFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onCreate: (name: string, parentId?: string) => void;
}

export function FolderSidebar({ folders, currentFolderId, onSelect, onCreate }: FolderSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolderId, setCreatingFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const toggleExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleCreateFolder = (parentId?: string) => {
    if (newFolderName.trim()) {
      onCreate(newFolderName.trim(), parentId);
      setNewFolderName('');
      setCreatingFolderId(null);
    }
  };

  const renderFolderTree = (items: FolderItem[], depth = 0) => (
    <ul className="space-y-1">
      {items.map(folder => (
        <li key={folder.id}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelect(folder.id)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
                currentFolderId === folder.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingFolderId(folder.id);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 rounded opacity-0 hover:opacity-100 transition-opacity"
                aria-label="Create subfolder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </button>
          </div>
          {creatingFolderId === folder.id && (
            <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${12 + depth * 16}px` }}>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder(folder.id)}
                onBlur={() => handleCreateFolder(folder.id)}
                autoFocus
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="New folder name"
              />
            </div>
          )}
          {expandedFolders.has(folder.id) && folder.children && (
            <div>{renderFolderTree(folder.children, depth + 1)}</div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
          currentFolderId === null
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Folder className="w-4 h-4" />
        <span>All Files</span>
      </button>
      <div className="mt-2">
        {renderFolderTree(folders)}
      </div>
      {creatingFolderId === null && (
        <button
          onClick={() => setCreatingFolderId('root')}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mt-2"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New folder</span>
        </button>
      )}
      {creatingFolderId === 'root' && (
        <div className="flex items-center gap-1 px-2 py-1 mt-2">
          <input
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            onBlur={() => handleCreateFolder()}
            autoFocus
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="New folder name"
          />
        </div>
      )}
    </div>
  );
}