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
import { FileView } from '../components/FileView';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StorageDashboard } from '../components/StorageDashboard';
import { ShareModal } from '../components/ShareModal';
import { RenameModal } from '../components/RenameModal';
import { MoveModal } from '../components/MoveModal';
import { SearchBar } from '../components/SearchBar';
import { LanguageToggle } from '../components/LanguageToggle';
import { AccentSelector } from '../components/AccentSelector';
import { UserMenu } from '../components/UserMenu';
import { FilePreviewModal } from '../components/FilePreviewModal';
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

interface StorageStats {
  total: { used: number; max: number; percentage: number };
  accounts: { id: string; name: string; used: number; max: number; percentage: number }[];
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
        const data = response.data;
        if (data && typeof data === 'object' && 
            data.total && typeof data.total === 'object' &&
            Array.isArray(data.accounts)) {
          setStats(data);
        } else {
          console.error('Invalid storage stats response:', data);
          setStats({
            total: { used: 0, max: 0, free: 0, percentage: 0 },
            accounts: []
          });
        }
      } catch (err) {
        console.error('Failed to fetch storage stats:', err);
        setStats({
          total: { used: 0, max: 0, free: 0, percentage: 0 },
          accounts: []
        });
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
      <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${getColor(totalPercent)}`} style={{ width: `${totalPercent}%` }} />
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
  const [folderTree, setFolderTree] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState<NavItem>('files');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  const [selectedFile, setSelectedFile] = useState<BackendFile | null>(null);
  const [previewFile, setPreviewFile] = useState<BackendFile | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await filesApi.list({
        folderId: currentFolderId || undefined,
        search: searchQuery || undefined,
      });
      const data = response.data;
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setFiles([]);
    }
  }, [currentFolderId, searchQuery]);

  const fetchFolders = useCallback(async () => {
    try {
      const [flatResponse, treeResponse] = await Promise.all([
        foldersApi.list(),
        foldersApi.tree(),
      ]);
      const flatData = flatResponse.data;
      const treeData = treeResponse.data;
      setFolders(Array.isArray(flatData) ? flatData : []);
      setFolderTree(Array.isArray(treeData) ? treeData : []);
    } catch (err) {
      console.error('Failed to fetch folders:', err);
      setFolders([]);
      setFolderTree([]);
    }
  }, []);

  const fetchStorageStats = useCallback(async () => {
    try {
      const response = await storageApi.stats();
      const data = response.data;
      if (data && typeof data === 'object' && 
          data.total && typeof data.total === 'object' &&
          Array.isArray(data.accounts)) {
        setStorageStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch storage stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchFolders();
    fetchStorageStats();
  }, [fetchFiles, fetchFolders, fetchStorageStats]);

  useEffect(() => {
    const handleUploadProgress = (event: CustomEvent) => {
      const { fileId, progress } = event.detail;
    };
    window.addEventListener('upload-progress', handleUploadProgress as EventListener);
    return () => window.removeEventListener('upload-progress', handleUploadProgress as EventListener);
  }, []);

  const handleFileUpload = async (file: globalThis.File, folderId?: string, onProgress?: (percent: number) => void) => {
    try {
      await filesApi.upload(file, folderId, onProgress);
      fetchFiles();
      fetchStorageStats();
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
      fetchStorageStats();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDownloadFile = async (file: BackendFile) => {
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
    setPreviewFile(file);
  };

  const handlePreviewClose = () => {
    setPreviewFile(null);
  };

  const handlePreviewNavigate = (direction: 'prev' | 'next') => {
    const currentIdx = files.findIndex(f => f.id === previewFile?.id);
    if (currentIdx === -1) return;
    const newIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1;
    if (newIdx >= 0 && newIdx < files.length) {
      setPreviewFile(files[newIdx]);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await filesApi.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', files.find(f => f.id === id)?.original_name || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType?.startsWith('text/')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType?.startsWith('video/')) return <FileText className="w-5 h-5 text-purple-500" />;
    if (mimeType?.startsWith('audio/')) return <FileText className="w-5 h-5 text-orange-500" />;
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

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text-primary">
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onNewFolder={() => { setSelectedFile(null); alert('New folder'); }}
        onUpload={() => { alert('Upload'); }}
        uploads={uploads}
        t={t}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          folders={folderTree}
          currentFolderId={currentFolderId}
          onSelect={setCurrentFolderId}
          onCreate={handleCreateFolder}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          storageStats={storageStats}
        />

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
              onDownload={handleDownloadFile}
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
              storageStats={storageStats}
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

      <FilePreviewModal
        file={previewFile}
        filesList={files}
        currentIndex={previewFile ? files.findIndex(f => f.id === previewFile.id) : 0}
        onClose={handlePreviewClose}
        onNavigate={handlePreviewNavigate}
        onDownload={handleDownload}
        isOpen={!!previewFile}
      />
    </div>
  );
}