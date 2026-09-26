import type { ReactNode } from 'react';
import { MoreVertical, Download, Edit, Trash2, Share2, Eye, Image, FileText, File, ChevronRight } from 'lucide-react';
import { Menu, MenuItem, MenuTrigger } from './Menu';
import { formatBytes } from '../utils/format';

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

interface FileGridProps {
  files: File[];
  viewMode: 'grid' | 'list';
  onDownload: (file: File) => void;
  onPreview: (file: File) => void;
  onRename: (file: File) => void;
  onMove: (file: File) => void;
  onDelete: (id: string, type: 'file' | 'folder') => void;
  onShare: (file: File) => void;
  getFileIcon: (mimeType: string) => ReactNode;
  formatSize: (bytes: number) => string;
  formatDate: (timestamp: number) => string;
}

export function FileGrid({
  files,
  viewMode,
  onDownload,
  onPreview,
  onRename,
  onMove,
  onDelete,
  onShare,
  getFileIcon,
  formatSize,
  formatDate,
}: FileGridProps) {
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

  const renderFileCard = (file: File) => {
    const type = getFileType(file.mime_type);
    const typeColor = getFileTypeColor(type);
    
    return (
      <div
        key={file.id}
        className="group relative bg-surface border border-surface-border rounded-2xl p-4 transition-all duration-300 hover:border-surface-border-hover hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        onClick={() => onPreview(file)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(file); } }}
      >
        {/* File Preview Area */}
        <div className="aspect-square bg-surface-secondary rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
          {getFileIcon(file.mime_type)}
          
          {/* Image thumbnail preview */}
          {file.mime_type?.startsWith('image/') && (
            <img
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/files/${file.id}/download`}
              alt={file.name}
              className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              loading="lazy"
            />
          )}
          
          {/* File type badge */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
            {type.toUpperCase()}
          </div>
        </div>

        {/* File Info */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary truncate" title={file.name}>
            {file.name}
          </p>
          
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary/50" />
              {file.mime_type}
            </span>
            <span>{formatSize(file.size)}</span>
          </div>

          <div className="pt-3 border-t border-surface-border flex items-center justify-between">
            <span className="text-xs text-text-tertiary">{formatDate(file.created_at)}</span>
            
            <Menu>
              <MenuTrigger asChild>
                <button className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors opacity-0 group-hover:opacity-100 transition-opacity" aria-label="More options">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </MenuTrigger>
              <MenuItem onClick={() => onPreview(file)}>
                <Eye className="w-4 h-4" />
                Preview
              </MenuItem>
              <MenuItem onClick={() => onDownload(file)}>
                <Download className="w-4 h-4" />
                Download
              </MenuItem>
              <MenuItem onClick={() => onShare(file)}>
                <Share2 className="w-4 h-4" />
                Share
              </MenuItem>
              <MenuItem onClick={() => onRename(file)}>
                <Edit className="w-4 h-4" />
                Rename
              </MenuItem>
              <MenuItem onClick={() => onMove(file)}>
                <ChevronRight className="w-4 h-4" />
                Move
              </MenuItem>
              <MenuItem onClick={() => onDelete(file.id, 'file')} className="text-accent-danger">
                <Trash2 className="w-4 h-4" />
                Delete
              </MenuItem>
            </Menu>
          </div>
        </div>
      </div>
    );
  };

  const renderFileRow = (file: File) => {
    const type = getFileType(file.mime_type);
    const typeColor = getFileTypeColor(type);

    return (
      <tr key={file.id} className="border-b border-surface-border hover:bg-surface-secondary/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor}`}>
              {getFileIcon(file.mime_type)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate max-w-xs" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary/50" />
                {formatDate(file.created_at)}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-text-secondary hidden sm:table-cell">{formatSize(file.size)}</td>
        <td className="px-4 py-3 text-sm text-text-tertiary hidden md:table-cell">{formatDate(file.created_at)}</td>
        <td className="px-4 py-3 text-right">
          <Menu>
            <MenuTrigger asChild>
              <button className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors" aria-label="More options">
                <MoreVertical className="w-4 h-4" />
              </button>
            </MenuTrigger>
            <MenuItem onClick={() => onPreview(file)}>
              <Eye className="w-4 h-4" />
              Preview
            </MenuItem>
            <MenuItem onClick={() => onDownload(file)}>
              <Download className="w-4 h-4" />
              Download
            </MenuItem>
            <MenuItem onClick={() => onShare(file)}>
              <Share2 className="w-4 h-4" />
              Share
            </MenuItem>
            <MenuItem onClick={() => onRename(file)}>
              <Edit className="w-4 h-4" />
              Rename
            </MenuItem>
            <MenuItem onClick={() => onMove(file)}>
              <ChevronRight className="w-4 h-4" />
              Move
            </MenuItem>
            <MenuItem onClick={() => onDelete(file.id, 'file')} className="text-accent-danger">
              <Trash2 className="w-4 h-4" />
              Delete
            </MenuItem>
          </Menu>
        </td>
      </tr>
    );
  };

  if (viewMode === 'list') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              <th className="px-4 py-3">{'Name'}</th>
              <th className="px-4 py-3 hidden sm:table-cell">{'Size'}</th>
              <th className="px-4 py-3 hidden md:table-cell">{'Modified'}</th>
              <th className="px-4 py-3 text-right">{'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {files.map(renderFileRow)}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      role="list"
      aria-label="Files"
    >
      {files.map(renderFileCard)}
    </div>
  );
}