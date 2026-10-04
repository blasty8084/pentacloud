import type { ReactNode } from 'react';
import { MoreVertical, Download, Edit, Trash2, Share2, Eye, Image, FileText, File, ChevronRight } from 'lucide-react';
import { Menu, MenuItem, MenuTrigger } from './Menu';
import { formatBytes } from '../utils/format';
import { FileIcon, getFileTypeColor } from './FileIcon';

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
  getFileIcon: (mimeType: string) => React.ReactNode;
  formatSize: (bytes: number) => string;
  formatDate: (timestamp: number) => string;
  t: (key: string) => string;
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
  formatSize,
  formatDate,
  t,
}: FileGridProps) {

  const renderFileCard = (file: File) => {
    const typeColor = getFileTypeColor(file.mime_type, file.name);
    
    return (
      <div
        key={file.id}
        className="group relative card-hover bg-surface border border-surface-border rounded-2xl p-4 transition-all duration-300 hover:border-surface-border-hover hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        onClick={() => onPreview(file)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(file); } }}
      >
        {/* File Preview Area */}
        <div className="aspect-square bg-surface-secondary rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
          <FileIcon mimeType={file.mime_type} fileName={file.name} className="w-12 h-12 text-text-tertiary" />
          
          {/* Image thumbnail preview */}
          {file.mime_type?.startsWith('image/') && (
            <img
              src={`${(import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : ''))}/files/${file.id}/download}`}
              alt={file.name}
              className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              loading="lazy"
            />
          )}
          
          {/* File type badge */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
            {file.mime_type?.startsWith('image/') ? 'IMG' : 
             file.mime_type === 'application/pdf' ? 'PDF' :
             file.mime_type?.startsWith('video/') ? 'VID' :
             file.mime_type?.startsWith('audio/') ? 'AUD' :
             file.mime_type?.startsWith('text/') ? 'TXT' : 'FILE'}
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
                <span>{t('Preview')}</span>
              </MenuItem>
              <MenuItem onClick={() => onDownload(file)}>
                <Download className="w-4 h-4" />
                <span>{t('Download')}</span>
              </MenuItem>
              <MenuItem onClick={() => onRename(file)}>
                <Edit className="w-4 h-4" />
                <span>{t('Rename')}</span>
              </MenuItem>
              <MenuItem onClick={() => onMove(file)}>
                <ChevronRight className="w-4 h-4" />
                <span>{t('Move')}</span>
              </MenuItem>
              <MenuItem onClick={() => onShare(file)}>
                <Share2 className="w-4 h-4" />
                <span>{t('Share')}</span>
              </MenuItem>
              <MenuItem onClick={() => onDelete(file.id, 'file')} className="text-accent-danger">
                <Trash2 className="w-4 h-4" />
                <span>{t('Delete')}</span>
              </MenuItem>
            </Menu>
          </div>
        </div>
      </div>
    );
  };

  const renderFileRow = (file: File) => {
    return (
      <tr className="hover:bg-surface-secondary/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <FileIcon mimeType={file.mime_type} fileName={file.name} className="w-10 h-10" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate" title={file.name}>{file.name}</p>
              <p className="text-xs text-text-tertiary">{file.mime_type}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-text-secondary">{formatSize(file.size)}</td>
        <td className="px-4 py-3 text-sm text-text-tertiary">{formatDate(file.created_at)}</td>
        <td className="px-4 py-3">
          <Menu>
            <MenuTrigger asChild>
              <button className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors" aria-label="More options">
                <MoreVertical className="w-4 h-4" />
              </button>
            </MenuTrigger>
            <MenuItem onClick={() => onPreview(file)}>
              <Eye className="w-4 h-4" />
              <span>{t('Preview')}</span>
            </MenuItem>
            <MenuItem onClick={() => onDownload(file)}>
              <Download className="w-4 h-4" />
              <span>{t('Download')}</span>
            </MenuItem>
            <MenuItem onClick={() => onRename(file)}>
              <Edit className="w-4 h-4" />
              <span>{t('Rename')}</span>
            </MenuItem>
            <MenuItem onClick={() => onMove(file)}>
              <ChevronRight className="w-4 h-4" />
              <span>{t('Move')}</span>
            </MenuItem>
            <MenuItem onClick={() => onShare(file)}>
              <Share2 className="w-4 h-4" />
              <span>{t('Share')}</span>
            </MenuItem>
            <MenuItem onClick={() => onDelete(file.id, 'file')} className="text-accent-danger">
              <Trash2 className="w-4 h-4" />
              <span>{t('Delete')}</span>
            </MenuItem>
          </Menu>
        </td>
      </tr>
    );
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {files.map(renderFileCard)}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="grid">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('Name')}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('Size')}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('Date Modified')}</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('Actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {files.map(renderFileRow)}
        </tbody>
      </table>
    </div>
  );
}