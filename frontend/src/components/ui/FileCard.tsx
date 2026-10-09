import type { ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { MoreVertical, Download, Edit, Trash2, Share2, Eye, ChevronRight, Star, Link2 } from 'lucide-react';
import { Menu, MenuItem, MenuTrigger } from '../Menu';
import { FileIcon, getFileTypeColor } from '../FileIcon';
import { formatBytes } from '../../utils/format';
import { Button } from '../Button';

export interface FileData {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  b2_account_id: string;
  created_at: number;
  starred?: boolean;
  shared?: boolean;
}

interface FileCardProps {
  file: FileData;
  variant?: 'grid' | 'compact';
  onPreview?: (file: FileData) => void;
  onDownload?: (file: FileData) => void;
  onRename?: (file: FileData) => void;
  onMove?: (file: FileData) => void;
  onDelete?: (file: FileData) => void;
  onShare?: (file: FileData) => void;
  onStar?: (file: FileData) => void;
  formatSize?: (bytes: number) => string;
  formatDate?: (timestamp: number) => string;
  t?: (key: string) => string;
  showActions?: boolean;
  selected?: boolean;
  onSelect?: (file: FileData) => void;
}

export function FileCard({
  file,
  variant = 'grid',
  onPreview,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onShare,
  onStar,
  formatSize = formatBytes,
  formatDate,
  t = (key: string) => key,
  showActions = true,
  selected,
  onSelect,
}: FileCardProps) {
  const typeColor = getFileTypeColor(file.mime_type, file.name);
  const isImage = file.mime_type?.startsWith('image/');

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPreview?.(file);
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (!e.currentTarget.contains(e.target as Node)) return;
    onPreview?.(file);
  };

  if (variant === 'compact') {
    return (
      <div
        className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
          selected
            ? 'bg-accent-primary-light/50 border border-accent-primary'
            : 'bg-surface border border-surface-border hover:bg-surface-secondary/50 hover:border-surface-border-hover'
        } cursor-pointer`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-selected={selected}
      >
        <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center flex-shrink-0">
          <FileIcon mimeType={file.mime_type} fileName={file.name} className="w-5 h-5 text-text-tertiary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-text-tertiary flex items-center gap-1">
            <span>{formatBytes(file.size)}</span>
            <span>•</span>
            <span>{file.mime_type}</span>
          </p>
        </div>
        {showActions && (
          <Menu>
            <MenuTrigger asChild>
              <button className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors opacity-0 group-hover:opacity-100 transition-opacity" aria-label="More options">
                <MoreVertical className="w-4 h-4" />
              </button>
            </MenuTrigger>
            <MenuItem onClick={() => onPreview?.(file)}>
              <Eye className="w-4 h-4" />
              <span>{t('Preview')}</span>
            </MenuItem>
            <MenuItem onClick={() => onDownload?.(file)}>
              <Download className="w-4 h-4" />
              <span>{t('Download')}</span>
            </MenuItem>
            <MenuItem onClick={() => onRename?.(file)}>
              <Edit className="w-4 h-4" />
              <span>{t('Rename')}</span>
            </MenuItem>
            <MenuItem onClick={() => onMove?.(file)}>
              <ChevronRight className="w-4 h-4" />
              <span>{t('Move')}</span>
            </MenuItem>
            <MenuItem onClick={() => onShare?.(file)}>
              <Share2 className="w-4 h-4" />
              <span>{t('Share')}</span>
            </MenuItem>
<MenuItem onClick={() => onDelete?.(file)} className="text-accent-danger">>
        <Trash2 className="w-4 h-4" />
        <span>{t('Delete')}</span>
      </MenuItem>
    </Menu>
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPreview?.(file);
    }
  };

  const actionsMenu = (
    <Menu>
      <MenuTrigger asChild>
        <button className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors" aria-label="More options">
          <MoreVertical className="w-4 h-4" />
        </button>
      </MenuTrigger>
      <MenuItem onClick={() => onPreview?.(file)}>
        <Eye className="w-4 h-4" />
        <span>{t('Preview')}</span>
      </MenuItem>
      <MenuItem onClick={() => onDownload?.(file)}>
        <Download className="w-4 h-4" />
        <span>{t('Download')}</span>
      </MenuItem>
      <MenuItem onClick={() => onRename?.(file)}>
        <Edit className="w-4 h-4" />
        <span>{t('Rename')}</span>
      </MenuItem>
      <MenuItem onClick={() => onMove?.(file)}>
        <ChevronRight className="w-4 h-4" />
        <span>{t('Move')}</span>
      </MenuItem>
      <MenuItem onClick={() => onShare?.(file)}>
        <Share2 className="w-4 h-4" />
        <span>{t('Share')}</span>
      </MenuItem>
      {onStar && (
        <MenuItem onClick={() => onStar?.(file)}>
          <Star className="w-4 h-4" />
          <span>{file.starred ? t('Unstar') : t('Star')}</span>
        </MenuItem>
      )}
      <MenuItem onClick={() => onDelete?.(file)} className="text-accent-danger">
        <Trash2 className="w-4 h-4" />
        <span>{t('Delete')}</span>
      </MenuItem>
    </Menu>

  return (
    <tr 
      className={`hover:bg-surface-secondary/50 transition-colors ${
        selected ? 'bg-accent-primary-light/50' : ''
      }`}
      onClick={(e) => {
        if (e.target instanceof HTMLButtonElement) return;
        onPreview?.(file);
      }}
      onKeyDown={handleKeyDown}
      role="row"
      aria-selected={selected}
      tabIndex={0}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FileIcon mimeType={file.mime_type} fileName={file.name} className="w-10 h-10" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate" title={file.name}>{file.name}</p>
            <p className="text-xs text-text-tertiary">{file.mime_type}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-text-secondary">{formatBytes(file.size)}</td>
        <td className="px-4 py-3 text-sm text-text-tertiary">{formatDate ? formatDate(file.created_at) : ''}</td>
        <td className="px-4 py-3">
          {showActions ? actionsMenu : null}
        </td>
      </tr>
    );
  }
}