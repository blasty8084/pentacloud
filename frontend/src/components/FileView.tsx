import { 
  Folder, ChevronRight, ChevronLeft, Upload, Search, 
  Grid, List, MoreHorizontal, Download, Upload as UploadIcon,
  FileText, Image, File, Clock, TrendingUp, Activity,
  Plus, Settings, Filter, ChevronDown
} from 'lucide-react';
import { UploadZone } from '../components/UploadZone';
import { FileGrid } from '../components/FileGrid';
import { SearchBar } from '../components/SearchBar';
import { formatBytes, formatDate } from '../utils/format';
import { Button } from '../components/Button';
import { storageApi } from '../api/client';
import { useState, useEffect, useCallback } from 'react';

interface ActivityItem {
  id: string;
  type: 'upload' | 'download' | 'delete' | 'share' | 'create' | 'move';
  fileName: string;
  user: string;
  timestamp: number;
  size?: number;
}

interface StorageStats {
  total: { used: number; max: number; percentage: number };
  accounts: { id: string; name: string; used: number; max: number; percentage: number }[];
}

interface FileViewProps {
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
  storageStats: StorageStats | null;
}

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

export function FileView({
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
  storageStats,
}: FileViewProps) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Generate mock activity from files
  useEffect(() => {
    const activities: ActivityItem[] = files
      .slice(0, 10)
      .map((file, index) => ({
        id: `act-${file.id}`,
        type: 'upload' as const,
        fileName: file.original_name,
        user: 'You',
        timestamp: file.created_at,
        size: file.size,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
    setActivity(activities);
  }, [files]);

  const getFileType = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType?.startsWith('video/')) return 'video';
    if (mimeType?.startsWith('audio/')) return 'audio';
    if (mimeType?.startsWith('text/')) return 'text';
    return 'file';
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'text-green-500 bg-green-500/10';
      case 'pdf': return 'text-red-500 bg-red-500/10';
      case 'video': return 'text-purple-500 bg-purple-500/10';
      case 'audio': return 'text-orange-500 bg-orange-500/10';
      case 'text': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const filteredFiles = files.filter(file => {
    if (filterType === 'all') return true;
    return getFileType(file.mime_type) === filterType;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
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

  const fileTypes = [
    { id: 'all', label: 'All Files', icon: FileText, count: files.length },
    { id: 'image', label: 'Images', icon: Image, count: files.filter(f => f.mime_type?.startsWith('image/')).length },
    { id: 'pdf', label: 'PDFs', icon: FileText, count: files.filter(f => f.mime_type === 'application/pdf').length },
    { id: 'video', label: 'Videos', icon: FileText, count: files.filter(f => f.mime_type?.startsWith('video/')).length },
    { id: 'audio', label: 'Audio', icon: FileText, count: files.filter(f => f.mime_type?.startsWith('audio/')).length },
    { id: 'text', label: 'Documents', icon: FileText, count: files.filter(f => f.mime_type?.startsWith('text/')).length },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-surface-border bg-surface/50 backdrop-blur-sm">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3 p-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm text-text-tertiary flex-1 min-w-0" aria-label="Breadcrumb">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-surface-secondary transition-colors"
            >
              <Folder className="w-4 h-4" />
              {!breadcrumbs.length && <span className="font-medium">All Files</span>}
            </button>
            {breadcrumbs.map((folder) => (
              <span key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-text-tertiary" />
                <button
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="px-2 py-1.5 rounded-xl hover:bg-surface-secondary transition-colors truncate max-w-[150px]"
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-surface-secondary/50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <FileText className="w-4 h-4" />
              <span>{files.length} items</span>
            </div>
            <div className="w-px h-6 bg-surface-border" />
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <TrendingUp className="w-4 h-4" />
              <span>{formatBytes(files.reduce((a, b) => a + b.size, 0))}</span>
            </div>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-surface-border">
          {/* Left: Search + Filters */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search in folder..."
                className="w-full"
              />
            </div>

            {/* File Type Filters */}
            <div className="flex items-center gap-1 border border-surface-border rounded-xl p-1" role="group" aria-label="File type filters">
              {fileTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    filterType === type.id
                      ? 'bg-accent-primary-light text-accent-primary'
                      : 'text-text-tertiary hover:text-text-primary hover:bg-surface-secondary'
                  }`}
                >
                  {type.icon}
                  <span className="hidden sm:inline">{type.label}</span>
                  {type.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      filterType === type.id
                        ? 'bg-accent-primary text-accent-primary-light'
                        : 'bg-surface-tertiary text-text-tertiary'
                    }`}>
                      {type.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Sort + View + Actions */}
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center gap-2 border border-surface-border rounded-xl px-2 py-1.5">
              <label className="text-xs text-text-tertiary hidden sm:block">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-sm font-medium text-text-secondary focus:outline-none cursor-pointer min-w-[120px]"
                aria-label="Sort by"
              >
                <option value="date">Date Modified</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1 border border-surface-border rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-accent-primary-light text-accent-primary' 
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-secondary'
                }`}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-accent-primary-light text-accent-primary' 
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-secondary'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => alert('New folder')}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Folder</span>
              </Button>
              <Button variant="primary" size="sm" onClick={() => alert('Upload')}>
                <UploadIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Dashboard Widgets Row */}
        <div className="p-4 lg:hidden">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary">Total Files</p>
                  <p className="text-2xl font-bold text-text-primary">{files.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary">Total Size</p>
                  <p className="text-2xl font-bold text-text-primary">{formatBytes(files.reduce((a, b) => a + b.size, 0))}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Stats Cards */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4 p-4">
          <div className="card card-hover p-5 animate-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Total Files</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{files.length}</p>
                <p className="text-xs text-accent-success mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{files.filter(f => Date.now() - f.created_at < 7 * 86400000).length} this week</span>
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-green-500" />
              </div>
            </div>
          </div>

          <div className="card card-hover p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Total Storage</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{formatBytes(files.reduce((a, b) => a + b.size, 0))}</p>
                <p className="text-xs text-text-tertiary mt-1">of {storageStats ? formatBytes(storageStats.total.max) : '—'} available</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="card card-hover p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Storage Used</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{storageStats ? storageStats.total.percentage : 0}%</p>
                <div className="mt-2 h-2 bg-surface-tertiary rounded-full overflow-hidden w-32">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      storageStats && storageStats.total.percentage >= 90 ? 'bg-accent-danger' : 
                      storageStats && storageStats.total.percentage >= 70 ? 'bg-accent-warning' : 'bg-accent-primary'
                    }`}
                    style={{ width: `${storageStats ? storageStats.total.percentage : 0}%` }}
                  />
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Activity className="w-7 h-7 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="card card-hover p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">File Types</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{Object.keys(files.reduce((acc, f) => {
                  const type = f.mime_type?.split('/')[0] || 'other';
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).length}</p>
                <p className="text-xs text-text-tertiary mt-1">unique types</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Filter className="w-7 h-7 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="hidden lg:block lg:fixed lg:right-4 lg:top-[140px] lg:w-80 lg:z-20">
          <div className="card animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-text-primary">Recent Activity</h3>
              </div>
              <button className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors" aria-label="Toggle activity">
                <ChevronDown className={`w-4 h-4 transition-transform ${showActivity ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className={`${showActivity ? 'block' : 'hidden'} max-h-96 overflow-y-auto`}>
              <div className="p-4 space-y-3">
                {activity.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <>
                    {activity.map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-secondary transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{item.fileName}</p>
                          <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                            <span>•</span>
                            <span>{item.user}</span>
                            <span>•</span>
                            <span>{formatDate(item.timestamp)}</span>
                            {item.size && <span className="flex items-center gap-1"><span>•</span><span>{formatBytes(item.size)}</span></span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="p-3 border-t border-surface-border text-center">
              <button className="text-sm text-accent-primary hover:text-accent-primary-hover font-medium">
                View all activity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:pr-84">
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
            </div>
          ) : sortedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-text-tertiary">
              <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
                <Folder className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-medium text-text-secondary mb-1">No files in this folder</p>
              <p className="text-sm text-text-tertiary">Drag and drop files above or click Upload to get started</p>
            </div>
          ) : (
            <FileGrid
              files={sortedFiles}
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
    </div>
  );
}