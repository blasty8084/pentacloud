import { useState, useEffect } from 'react';
import { 
  Folder, ChevronRight, Plus, FolderPlus, 
  Home, Share, BarChart2, Settings,
  ChevronLeft, ChevronDown, MoreHorizontal,
  Upload, Download, Archive, Globe
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { formatBytes } from '../utils/format';
import { storageApi } from '../api/client';

interface FolderItem {
  id: string;
  name: string;
  parent_id: string | null;
  children?: FolderItem[];
}

interface SidebarProps {
  folders: FolderItem[];
  currentFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onCreate: (name: string, parentId?: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  storageStats: {
    total: { used: number; max: number; percentage: number };
    accounts: { id: string; name: string; used: number; max: number; percentage: number }[];
  } | null;
}

export function Sidebar({
  folders,
  currentFolderId,
  onSelect,
  onCreate,
  sidebarCollapsed,
  setSidebarCollapsed,
  activeNav,
  setActiveNav,
  storageStats,
}: SidebarProps) {
  const { themeMode, setThemeMode, resolvedTheme } = useTheme();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolderId, setCreatingFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showStorageDetails, setShowStorageDetails] = useState(false);

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
    <ul className="space-y-0.5" role="tree" aria-label="Folders">
      {items.map(folder => (
        <li key={folder.id}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelect(folder.id)}
              className={`group flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                currentFolderId === folder.id
                  ? 'bg-accent-primary-light text-accent-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
              role="treeitem"
              aria-selected={currentFolderId === folder.id}
              aria-expanded={expandedFolders.has(folder.id)}
            >
              {folder.children && folder.children.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id); }}
                  className={`p-1 flex-shrink-0 rounded-lg transition-all ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`}
                  aria-label={expandedFolders.has(folder.id) ? 'Collapse' : 'Expand'}
                >
                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                </button>
              )}
              {folder.children && folder.children.length === 0 && <div className="w-4 h-4 flex-shrink-0" />}
              <Folder className="w-4 h-4 flex-shrink-0 text-text-tertiary group-active:text-accent-primary" />
              <span className="truncate flex-1">{folder.name}</span>
              {!sidebarCollapsed && (
                <button
                  onClick={(e) => { e.stopPropagation(); setCreatingFolderId(folder.id); }}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Create subfolder"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </button>
          </div>
          {creatingFolderId === folder.id && (
            <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${28 + depth * 16}px` }}>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder(folder.id)}
                onBlur={() => handleCreateFolder(folder.id)}
                autoFocus
                className="input flex-1 px-2 py-1.5 text-sm"
                placeholder="New folder name"
              />
            </div>
          )}
          {expandedFolders.has(folder.id) && folder.children && (
            <div role="group" aria-label={`${folder.name} contents`}>
              {renderFolderTree(folder.children, depth + 1)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const handleCreateFolder = (parentId?: string) => {
    if (newFolderName.trim()) {
      onCreate(newFolderName.trim(), parentId);
      setNewFolderName('');
      setCreatingFolderId(null);
}
      )};
    </ul>
  );

  const navItems = [
    { id: 'files', label: 'My Files', icon: Home, count: null },
    { id: 'shared', label: 'Shared', icon: Share, count: null },
    { id: 'storage', label: 'Storage', icon: BarChart2, count: null },
    { id: 'settings', label: 'Settings', icon: Settings, count: null },
  ];

  return (
    <aside
      className={`fixed lg:relative z-40 flex flex-col transition-all duration-300 ease-out bg-surface border-r border-surface-border ${
        sidebarCollapsed ? 'w-[80px]' : 'w-[280px]'
      }`}
      style={{ height: sidebarCollapsed ? '100vh' : '100%', width: sidebarCollapsed ? '80px' : '280px' }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-[64px] px-4 border-b border-surface-border flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent-primary-light flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-accent-primary" />
            </div>
            <span className="text-xl font-bold text-text-primary">PENTACLOUD</span>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`p-2 rounded-xl transition-all duration-200 hover:bg-surface-secondary ${
            sidebarCollapsed ? 'ml-auto' : 'ml-2'
          }`}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Main navigation">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeNav === item.id
                ? 'bg-accent-primary-light text-accent-primary font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!sidebarCollapsed && <span className="truncate flex-1">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Folders Section */}
      {!sidebarCollapsed && (
        <div className="border-t border-surface-border px-3 py-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Folders</h3>
            <button
              onClick={() => setCreatingFolderId('root')}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Create folder"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onSelect(null)}
            className={`group w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentFolderId === null
                ? 'bg-accent-primary-light text-accent-primary font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            <Folder className="w-4 h-4 text-text-tertiary group-active:text-accent-primary" />
            <span className="truncate flex-1">All Files</span>
          </button>

          <div className="space-y-0.5">
            {folders.filter(f => f.parent_id === null).map(folder => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                depth={0}
                currentFolderId={currentFolderId}
                onSelect={onSelect}
                onCreate={handleCreateFolder}
                expandedFolders={expandedFolders}
                setExpandedFolders={setExpandedFolders}
                creatingFolderId={creatingFolderId}
                setCreatingFolderId={setCreatingFolderId}
                newFolderName={newFolderName}
                setNewFolderName={setNewFolderName}
              />
            ))}
          </div>

          <button
            onClick={() => setCreatingFolderId('root')}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded-xl transition-colors mt-1"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New folder</span>
          </button>
        </div>
      )}

      {/* Storage Stats */}
      {!sidebarCollapsed && storageStats && (
        <div className="border-t border-surface-border px-3 py-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Storage</h3>
            <button
              onClick={() => setShowStorageDetails(!showStorageDetails)}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label={showStorageDetails ? 'Hide details' : 'Show details'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showStorageDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Total</span>
                <span className="font-medium text-text-primary">{formatBytes(storageStats.total.used)} / {formatBytes(storageStats.total.max)}</span>
              </div>
              <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    storageStats.total.percentage >= 90 ? 'bg-accent-danger' : 
                    storageStats.total.percentage >= 70 ? 'bg-accent-warning' : 'bg-accent-primary'
                  }`}
                  style={{ width: `${storageStats.total.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>{formatBytes(storageStats.total.used)} used</span>
                <span>{formatBytes(storageStats.total.max - storageStats.total.used)} free</span>
              </div>
            </div>

            {showStorageDetails && (
              <div className="space-y-2 pt-2 border-t border-surface-border">
                {storageStats.accounts.map(account => (
                  <div key={account.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary truncate max-w-[140px]">{account.name}</span>
                      <span className="font-medium text-text-primary">{account.percentage}%</span>
                    </div>
                    <div className="h-1 bg-surface-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          account.percentage >= 90 ? 'bg-accent-danger' : 
                          account.percentage >= 70 ? 'bg-accent-warning' : 'bg-accent-primary'
                        }`}
                        style={{ width: `${account.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-text-tertiary">
                      <span>{formatBytes(account.used)} used</span>
                      <span>{formatBytes(account.max - account.used)} free</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      {!sidebarCollapsed && (
        <div className="border-t border-surface-border px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Appearance</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(['light', 'dark', 'system'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                className={`p-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  themeMode === mode
                    ? 'bg-accent-primary-light text-accent-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                }`}
              >
                {mode === 'light' && <span className="flex items-center justify-center gap-1"><span className="w-4 h-4 rounded-full bg-amber-400" /> Light</span>}
                {mode === 'dark' && <span className="flex items-center justify-center gap-1"><span className="w-4 h-4 rounded-full bg-slate-800" /> Dark</span>}
                {mode === 'system' && <span className="flex items-center justify-center gap-1"><span className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-slate-800" /> Auto</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="border-t border-surface-border px-3 py-3 space-y-2">
          <div className="text-xs text-text-tertiary text-center">
            v1.0.0 • PENTACLOUD
          </div>
        </div>
      )}
    </aside>
  );
}

function FolderTreeItem({
  folder,
  depth,
  currentFolderId,
  onSelect,
  onCreate,
  expandedFolders,
  setExpandedFolders,
  creatingFolderId,
  setCreatingFolderId,
  newFolderName,
  setNewFolderName,
}: {
  folder: FolderItem;
  depth: number;
  currentFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onCreate: (name: string, parentId?: string) => void;
  expandedFolders: Set<string>;
  setExpandedFolders: (folders: Set<string>) => void;
  creatingFolderId: string | null;
  setCreatingFolderId: (id: string | null) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
}) {
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <>
      <button
        onClick={() => onSelect(folder.id)}
        className={`group flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          currentFolderId === folder.id
            ? 'bg-accent-primary-light text-accent-primary font-semibold'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        role="treeitem"
        aria-selected={currentFolderId === folder.id}
        aria-expanded={hasChildren && expandedFolders.has(folder.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpandedFolders(prev => { const next = new Set(prev); if (next.has(folder.id)) next.delete(folder.id); else next.add(folder.id); return next; }); }}
            className={`p-1 flex-shrink-0 rounded-lg transition-all ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`}
            aria-label={expandedFolders.has(folder.id) ? 'Collapse' : 'Expand'}
          >
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </button>
        )}
        {hasChildren === false && <div className="w-4 h-4 flex-shrink-0" />}
        <Folder className="w-4 h-4 flex-shrink-0 text-text-tertiary group-active:text-accent-primary" />
        <span className="truncate flex-1">{folder.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setCreatingFolderId(folder.id); }}
          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Create subfolder"
        >
          <Plus className="w-4 h-4" />
        </button>
      </button>
      
      {creatingFolderId === folder.id && (
        <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${28 + depth * 16}px` }}>
          <input
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder(folder.id)}
            onBlur={() => handleCreateFolder(folder.id)}
            autoFocus
            className="input flex-1 px-2 py-1.5 text-sm"
            placeholder="New folder name"
          />
        </div>
      )}
      
      {hasChildren && expandedFolders.has(folder.id) && (
        <div role="group" aria-label={`${folder.name} contents`}>
          {folder.children!.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              currentFolderId={currentFolderId}
              onSelect={onSelect}
              onCreate={onCreate}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
              creatingFolderId={creatingFolderId}
              setCreatingFolderId={setCreatingFolderId}
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
            />
          ))}
        </div>
      )}
    </>
  );
}