import type { ReactNode } from 'react';
import { MoreVertical, Download, Edit, Trash2, Share2, Eye } from 'lucide-react';
import { Menu, MenuItem, MenuTrigger } from './Menu';

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
  const renderFileCard = (file: File) => (
    <div
      key={file.id}
      className="group bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
      onDoubleClick={() => onPreview(file)}
    >
      <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
        {getFileIcon(file.mime_type)}
        {file.mime_type?.startsWith('image/') && (
          <img
            src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/files/${file.id}/download`}
            alt={file.name}
            className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
            loading="lazy"
          />
        )}
      </div>
      <p className="text-sm font-medium text-gray-900 truncate mb-1" title={file.name}>
        {file.name}
      </p>
      <p className="text-xs text-gray-500 mb-2">{formatSize(file.size)}</p>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formatDate(file.created_at)}</span>
        <Menu>
          <MenuTrigger asChild>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <MoreVertical className="w-4 h-4" />
            </button>
          </MenuTrigger>
          <MenuItem onClick={() => onPreview(file)}><Eye className="w-4 h-4" /> Preview</MenuItem>
          <MenuItem onClick={() => onDownload(file)}><Download className="w-4 h-4" /> Download</MenuItem>
          <MenuItem onClick={() => onShare(file)}><Share2 className="w-4 h-4" /> Share</MenuItem>
          <MenuItem onClick={() => onRename(file)}><Edit className="w-4 h-4" /> Rename</MenuItem>
          <MenuItem onClick={() => onMove(file)}><Share2 className="w-4 h-4" /> Move</MenuItem>
          <MenuItem onClick={() => onDelete(file.id, 'file')} className="text-red-600"><Trash2 className="w-4 h-4" /> Delete</MenuItem>
        </Menu>
      </div>
    </div>
  );

  const renderFileRow = (file: File) => (
    <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
            {getFileIcon(file.mime_type)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-xs" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-gray-500">{formatDate(file.created_at)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{formatSize(file.size)}</td>
      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{formatDate(file.created_at)}</td>
      <td className="px-4 py-3 text-right">
        <Menu>
          <MenuTrigger asChild>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <MoreVertical className="w-4 h-4" />
            </button>
          </MenuTrigger>
          <MenuItem onClick={() => onPreview(file)}><Eye className="w-4 h-4" /> Preview</MenuItem>
          <MenuItem onClick={() => onDownload(file)}><Download className="w-4 h-4" /> Download</MenuItem>
          <MenuItem onClick={() => onShare(file)}><Share2 className="w-4 h-4" /> Share</MenuItem>
          <MenuItem onClick={() => onRename(file)}><Edit className="w-4 h-4" /> Rename</MenuItem>
          <MenuItem onClick={() => onMove(file)}><Share2 className="w-4 h-4" /> Move</MenuItem>
          <MenuItem onClick={() => onDelete(file.id, 'file')} className="text-red-600"><Trash2 className="w-4 h-4" /> Delete</MenuItem>
        </Menu>
      </td>
    </tr>
  );

  if (viewMode === 'list') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 hidden sm:table-cell">Size</th>
              <th className="px-4 py-3 hidden md:table-cell">Modified</th>
              <th className="px-4 py-3 text-right">Actions</th>
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