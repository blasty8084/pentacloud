import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUpload } from '../context/UploadContext';
import { filesApi, foldersApi, storageApi, sharesApi } from '../api/client';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { UploadZone } from '../components/UploadZone';
import { FileGrid } from '../components/FileGrid';
import { FolderSidebar } from '../components/FolderSidebar';
import { StorageDashboard } from '../components/StorageDashboard';
import { ShareModal } from '../components/ShareModal';
import { RenameModal } from '../components/RenameModal';
import { MoveModal } from '../components/MoveModal';
import { SearchBar } from '../components/SearchBar';
import {
  FolderPlus, Upload, RefreshCw, LogOut, Menu, X, ChevronRight,
  MoreVertical, Download, Edit, Trash2, Share2, Eye, FileText,
  Image, File, Folder, Search, Settings
} from 'lucide-react';

interface File {
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

interface Share {
  token: string;
  shareUrl: string;
  expiresAt: number | null;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { uploads, clearCompleted } = useUpload();
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderTree, setFolderTree] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showStorage, setShowStorage] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      // UploadContext handles this
    };
    window.addEventListener('upload-progress', handleUploadProgress as EventListener);
    return () => window.removeEventListener('upload-progress', handleUploadProgress as EventListener);
  }, []);

  const handleFileUpload = async (file: File, folderId?: string) => {
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
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
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

  const handleDownload = async (file: File) => {
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

  const handlePreview = (file: File) => {
    navigate(`/preview/${file.id}`);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType?.startsWith('text/')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  const breadcrumbs = [];
  if (currentFolderId) {
    let current = folders.find(f => f.id === currentFolderId);
    while (current) {
      breadcrumbs.unshift(current);
      current = folders.find(f => f.id === current.parent_id);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PENTACLOUD</span>
            </div>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search files..."
          />

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowStorage(!showStorage)}>
              <Settings className="w-4 h-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
              <span className="font-medium">{user?.name || user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-200 overflow-hidden flex flex-col`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Folders</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile({ name: 'new-folder', id: 'new-folder' } as any)}
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>
            <FolderSidebar
              folders={folderTree}
              currentFolderId={currentFolderId}
              onSelect={setCurrentFolderId}
              onCreate={handleCreateFolder}
            />
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <nav className="flex items-center gap-1 text-sm text-gray-600" aria-label="Breadcrumb">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="hover:text-gray-900 px-2 py-1 rounded"
                >
                  <Folder className="w-4 h-4 inline" />
                </button>
                {breadcrumbs.map((folder, i) => (
                  <span key={folder.id} className="flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="hover:text-gray-900 px-2 py-1 rounded"
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
                  className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                  aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <ChevronRight
                    className={`w-4 h-4 transform transition-transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`}
                  />
                </button>
                <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    aria-label="Grid view"
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
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    aria-label="List view"
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
            <UploadZone
              onUpload={handleFileUpload}
              folderId={currentFolderId}
              disabled={uploads.some(u => u.status === 'uploading')}
            />
          </div>

          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : sortedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Folder className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No files in this folder</p>
                <p className="text-sm">Drag and drop files above or click to upload</p>
              </div>
            ) : (
              <FileGrid
                files={sortedFiles}
                viewMode={viewMode}
                onDownload={handleDownload}
                onPreview={handlePreview}
                onRename={(file) => {
                  setSelectedFile(file);
                  setRenameModalOpen(true);
                }}
                onMove={(file) => {
                  setSelectedFile(file);
                  setMoveModalOpen(true);
                }}
                onDelete={handleDelete}
                onShare={(file) => {
                  setSelectedFile(file);
                  setShareModalOpen(true);
                }}
                getFileIcon={getFileIcon}
                formatSize={formatSize}
                formatDate={formatDate}
              />
            )}
          </div>
        </main>
      </div>

      <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Create Share Link" size="sm">
        <ShareModal
          file={selectedFile!}
          onCreate={handleCreateShare}
          onClose={() => setShareModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} title="Rename" size="sm">
        <RenameModal
          item={selectedFile!}
          type="file"
          onRename={handleRename}
          onClose={() => setRenameModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={moveModalOpen} onClose={() => setMoveModalOpen(false)} title="Move to Folder" size="sm">
        <MoveModal
          item={selectedFile!}
          type="file"
          folders={folders}
          currentFolderId={currentFolderId}
          onMove={handleMove}
          onClose={() => setMoveModalOpen(false)}
        />
      </Modal>

      {showStorage && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowStorage(false)} />
          <StorageDashboard onClose={() => setShowStorage(false)} />
        </div>
      )}
    </div>
  );
}

import { Cloud } from 'lucide-react';