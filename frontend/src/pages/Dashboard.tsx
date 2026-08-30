import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUpload } from '../context/UploadContext';
import { useTheme } from '../context/ThemeContext';
import { filesApi, foldersApi, sharesApi, storageApi } from '../api/client';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { UploadZone } from '../components/UploadZone';
import { FileGrid } from '../components/FileGrid';
import { FolderSidebar } from '../components/FolderSidebar';
import { StorageDashboard } from '../components/StorageDashboard';
import { ShareModal } from '../components/ShareModal';
import { RenameModal } from '../components/RenameModal';
import { MoveModal } from '../components/MoveModal';
import { SearchBar } from '../components/SearchBar';
import { LanguageToggle } from '../components/LanguageToggle';
import { AccentSelector } from '../components/AccentSelector';
import { UserMenu } from '../components/UserMenu';
import { formatBytes, formatDate } from '../utils/format';
import {
  FolderPlus, LogOut, Menu, X, ChevronRight, ChevronLeft,
  MoreVertical, Download, Edit, Trash2, Share2, Eye, FileText,
  Image, File, Folder, Settings, Cloud, HardDrive, Share, Users,
  BarChart2, Home, Globe, Palette
} from 'lucide-react';

interface BackendFile {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  b2_account_id: string;
  created_at: number;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  children?: Folder[];
}

type NavItem = 'files' | 'shared' | 'storage' | 'settings';

const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
  { id: 'files', label: 'My Files', icon: <Home className="w-5 h-5" /> },
  { id: 'shared', label: 'Shared', icon: <Share className="w-5 h-5" /> },
  { id: 'storage', label: 'Storage Usage', icon: <BarChart2 className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

function StorageMeterMini({ t }: { t: (key: string) => string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await storageApi.stats();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch storage stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) return null;

  const totalPercent = stats.total.percentage;
  const getColor = (p: number) => p >= 90 ? 'bg-accent-danger' : p >= 70 ? 'bg-accent-warning' : 'bg-accent-primary';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{t('Total Storage')}</span>
        <span className="font-medium text-text-primary">{formatBytes(stats.total.used)} / {formatBytes(stats.total.max)}</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-bar-fill ${getColor(totalPercent)}`} style={{ width: `${totalPercent}%` }} />
      </div>
      <div className="flex justify-between text-xs text-text-tertiary">
        <span>{formatBytes(stats.total.used)} {t('Used')}</span>
        <span>{formatBytes(stats.total.free)} {t('Free')}</span>
      </div>
    </div>
  );
}

function SharedView({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center text-text-tertiary">
        <Share className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-medium mb-2">{t('Shared')}</h2>
        <p>Shared files and folders will appear here</p>
      </div>
    </div>
  );
}

function StorageView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-overlay-backdrop z-modal" onClick={onClose} />
      <StorageDashboard onClose={onClose} />
    </div>
  );
}

function SettingsView({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6">{t('Settings')}</h1>
      <div className="card p-6">
        <p className="text-text-secondary">Settings page - Account, B2 accounts, Security, Danger Zone</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { uploads } = useUpload();
  const { t, language, setLanguage, accent, setAccent } = useTheme();
  const navigate = useNavigate();

  const [files, setFiles] = useState<BackendFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderTree, setFolderTree] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState<NavItem>('files');

  const [selectedFile, setSelectedFile] = useState<BackendFile | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await filesApi.list({
        folderId: currentFolderId || undefined,
        search: searchQuery || undefined,
      });
      setFiles(response.data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  }, [currentFolderId, searchQuery]);

  const fetchFolders = useCallback(async () => {
    try {
      const [flatResponse, treeResponse] = await Promise.all([
        foldersApi.list(),
        foldersApi.tree(),
      ]);
      setFolders(flatResponse.data);
      setFolderTree(treeResponse.data);
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, [fetchFiles, fetchFolders]);

  useEffect(() => {
    const handleUploadProgress = (event: CustomEvent) => {
      const { fileId, progress } = event.detail;
    };
    window.addEventListener('upload-progress', handleUploadProgress as EventListener);
    return () => window.removeEventListener('upload-progress', handleUploadProgress as EventListener);
  }, []);

  const handleFileUpload = async (file: globalThis.File, folderId?: string) => {
    try {
      await filesApi.upload(file, folderId);
      fetchFiles();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      await foldersApi.create({ name, parentId });
      fetchFolders();
      fetchFiles();
    } catch (err) {
      console.error('Create folder failed:', err);
    }
  };

  const handleRename = async (id: string, name: string, type: 'file' | 'folder') => {
    try {
      if (type === 'file') {
        await filesApi.update(id, { name });
      } else {
        await foldersApi.update(id, { name });
      }
      fetchFiles();
      fetchFolders();
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  const handleMove = async (id: string, folderId: string | null, type: 'file' | 'folder') => {
    try {
      if (type === 'file') {
        await filesApi.update(id, { folderId });
      } else {
        await foldersApi.update(id, { parentId: folderId });
      }
      fetchFiles();
      fetchFolders();
    } catch (err) {
      console.error('Move failed:', err);
    }
  };

  const handleDelete = async (id: string, type: 'file' | 'folder') => {
    if (!confirm(t(`Are you sure you want to delete this ${type}?`))) return;
    try {
      if (type === 'file') {
        await filesApi.delete(id);
      } else {
        await foldersApi.delete(id);
      }
      fetchFiles();
      fetchFolders();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDownload = async (file: BackendFile) => {
    try {
      const response = await filesApi.download(file.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleCreateShare = async (fileId: string, expiresInHours?: number) => {
    try {
      const response = await sharesApi.create({ fileId, expiresInHours });
      return response.data;
    } catch (err) {
      console.error('Create share failed:', err);
      return null;
    }
  };

  const handlePreview = (file: BackendFile) => {
    navigate(`/preview/${file.id}`);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType?.startsWith('text/')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const sortedFiles = [...files].sort((a, b) => {
    let aVal: any, bVal: any;
    switch (sortBy) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'size':
        aVal = a.size;
        bVal = b.size;
        break;
      case 'date':
        aVal = a.created_at;
        bVal = b.created_at;
        break;
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const breadcrumbs: Folder[] = [];
  if (currentFolderId) {
    let current: Folder | undefined = folders.find(f => f.id === currentFolderId);
    while (current) {
      breadcrumbs.unshift(current);
      const parentId = current.parent_id;
      current = parentId ? folders.find(f => f.id === parentId) : undefined;
    }
  }

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col text-text-primary">
      <header className="bg-surface-primary border-b border-surface-border sticky top-0 z-40">
        <div className="flex items-center justify-between h-[var(--header-height)] px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors lg:hidden"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center flex-shrink-0">
                <Cloud className="w-5 h-5 text-text-on-accent" />
              </div>
              {!sidebarCollapsed && <span className="text-xl font-bold">PENTACLOUD</span>}
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-4 sm:mx-8 hidden md:block">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('Search files...')}
            />
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle currentLang={language} onChange={setLanguage} />
            <AccentSelector currentAccent={accent} onChange={setAccent} />
            <UserMenu user={user} onLogout={logout} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`flex-shrink-0 bg-surface-primary border-r border-surface-border transition-all duration-300 flex flex-col overflow-hidden`}
          style={{ width: sidebarWidth }}
        >
          <nav className="flex-1 flex flex-col p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  activeNav === item.id ? 'bg-accent-primary-light text-accent-primary font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{t(item.label)}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="p-4 border-t border-surface-border space-y-4">
              <StorageMeterMini t={t} />
              <div className="pt-4 border-t border-surface-border">
                <LanguageToggle currentLang={language} onChange={setLanguage} />
                <AccentSelector currentAccent={accent} onChange={setAccent} />
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {activeNav === 'files' && (
            <FileView
              files={sortedFiles}
              folders={folders}
              folderTree={folderTree}
              currentFolderId={currentFolderId}
              setCurrentFolderId={setCurrentFolderId}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              loading={loading}
              breadcrumbs={breadcrumbs}
              onFileUpload={handleFileUpload}
              onCreateFolder={handleCreateFolder}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onRename={(file) => { setSelectedFile(file); setRenameModalOpen(true); }}
              onMove={(file) => { setSelectedFile(file); setMoveModalOpen(true); }}
              onDelete={handleDelete}
              onShare={(file) => { setSelectedFile(file); setShareModalOpen(true); }}
              getFileIcon={getFileIcon}
              formatSize={formatBytes}
              formatDate={formatDate}
              uploads={uploads}
              t={t}
            />
          )}

          {activeNav === 'shared' && <SharedView t={t} />}

          {activeNav === 'storage' && <StorageView onClose={() => {}} />}

          {activeNav === 'settings' && <SettingsView t={t} />}
        </main>
      </div>

      <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} title={t('Create Share Link')} size="sm">
        <ShareModal file={selectedFile!} onCreate={handleCreateShare} onClose={() => setShareModalOpen(false)} />
      </Modal>

      <Modal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} title={t('Rename')} size="sm">
        <RenameModal item={selectedFile!} type="file" onRename={handleRename} onClose={() => setRenameModalOpen(false)} />
      </Modal>

      <Modal isOpen={moveModalOpen} onClose={() => setMoveModalOpen(false)} title={t('Move to Folder')} size="sm">
        <MoveModal item={selectedFile!} type="file" folders={folders} currentFolderId={currentFolderId} onMove={handleMove} onClose={() => setMoveModalOpen(false)} />
      </Modal>
    </div>
  );
}

function FileView({
  files,
  folders,
  folderTree,
  currentFolderId,
  setCurrentFolderId,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  loading,
  breadcrumbs,
  onFileUpload,
  onCreateFolder,
  onDownload,
  onPreview,
  onRename,
  onMove,
  onDelete,
  onShare,
  getFileIcon,
  formatSize,
  formatDate,
  uploads,
  t,
}: {
  files: BackendFile[];
  folders: Folder[];
  folderTree: Folder[];
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortBy: 'name' | 'size' | 'date';
  setSortBy: (by: 'name' | 'size' | 'date') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  loading: boolean;
  breadcrumbs: Folder[];
  onFileUpload: (file: globalThis.File, folderId?: string) => Promise<void>;
  onCreateFolder: (name: string, parentId?: string) => Promise<void>;
  onDownload: (file: BackendFile) => Promise<void>;
  onPreview: (file: BackendFile) => void;
  onRename: (file: BackendFile) => void;
  onMove: (file: BackendFile) => void;
  onDelete: (id: string, type: 'file' | 'folder') => Promise<void>;
  onShare: (file: BackendFile) => void;
  getFileIcon: (mimeType: string) => React.ReactNode;
  formatSize: (bytes: number) => string;
  formatDate: (timestamp: number) => string;
  uploads: { fileId: string; status: string }[];
  t: (key: string) => string;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-surface-border bg-surface-primary/50 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <nav className="flex items-center gap-1 text-sm text-text-tertiary" aria-label="Breadcrumb">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="hover:text-text-primary px-2 py-1 rounded flex items-center gap-1"
            >
              <Folder className="w-4 h-4" />
              {!breadcrumbs.length && <span className="font-medium">{t('All Files')}</span>}
            </button>
            {breadcrumbs.map((folder) => (
              <span key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="hover:text-text-primary px-2 py-1 rounded truncate max-w-[150px]"
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input px-2 py-1 text-sm"
            >
              <option value="date">{t('Date Modified')}</option>
              <option value="name">{t('Name')}</option>
              <option value="size">{t('Size')}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn-ghost btn-sm"
              aria-label={sortOrder === 'asc' ? t('Sort descending') : t('Sort ascending')}
            >
              <ChevronRight className={`w-4 h-4 transform transition-transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
            </button>
            <div className="flex items-center gap-1 border border-surface-border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-accent-primary-light text-accent-primary' : 'text-text-tertiary hover:text-text-primary'}`}
                aria-label={t('Grid view')}
              >
                <div className="w-5 h-5 grid grid-cols-2 gap-1">
                  <div className="bg-current rounded" />
                  <div className="bg-current rounded" />
                  <div className="bg-current rounded" />
                  <div className="bg-current rounded" />
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-accent-primary-light text-accent-primary' : 'text-text-tertiary hover:text-text-primary'}`}
                aria-label={t('List view')}
              >
                <div className="w-5 h-5 flex flex-col gap-1">
                  <div className="h-1 bg-current rounded" />
                  <div className="h-1 bg-current rounded w-3/4" />
                  <div className="h-1 bg-current rounded w-1/2" />
                </div>
              </button>
            </div>
          </div>
        </div>
        <UploadZone onUpload={onFileUpload} folderId={currentFolderId ?? undefined} disabled={uploads.some((u: { status: string }) => u.status === 'uploading')} />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
            <Folder className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">{t('No files in this folder')}</p>
            <p className="text-sm">{t('Drag and drop files above or click to upload')}</p>
          </div>
        ) : (
          <FileGrid
            files={files}
            viewMode={viewMode}
            onDownload={onDownload}
            onPreview={onPreview}
            onRename={onRename}
            onMove={onMove}
            onDelete={onDelete}
            onShare={onShare}
            getFileIcon={getFileIcon}
            formatSize={formatSize}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  );
}