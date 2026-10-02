import type { ReactNode } from 'react';
import { 
  Image, FileText, Video, Music, 
  File, FileArchive, FileCode, FileSpreadsheet, 
  FileAudio, FileVideo, FileImage,
  FileType, FileQuestion, Folder, FolderOpen
} from 'lucide-react';

interface FileIconProps {
  mimeType?: string;
  fileName?: string;
  isFolder?: boolean;
  isOpen?: boolean;
  className?: string;
  size?: number;
}

function getFileType(mimeType: string, fileName: string): string {
  if (!mimeType) return 'unknown';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar') || mimeType.includes('gzip')) return 'archive';
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('html') || mimeType.includes('css')) return 'code';
  return 'file';
}

export function FileIcon({ mimeType, fileName, isFolder, isOpen, className, size = 20 }: FileIconProps) {
  if (isFolder) {
    return (
      <FolderOpen className={className} style={{ width: size, height: size }} />
    );
  }

  const type = getFileType(mimeType || '', fileName || '');
  const sizeStyle = { width: size, height: size };

  switch (type) {
    case 'image':
      return <FileImage className={className} style={sizeStyle} />;
    case 'pdf':
      return <FileType className={className} style={sizeStyle} />;
    case 'video':
      return <FileVideo className={className} style={sizeStyle} />;
    case 'audio':
      return <FileAudio className={className} style={sizeStyle} />;
    case 'spreadsheet':
      return <FileSpreadsheet className={className} style={sizeStyle} />;
    case 'presentation':
      return <FileText className={className} style={sizeStyle} />;
    case 'document':
      return <FileText className={className} style={sizeStyle} />;
    case 'archive':
      return <FileArchive className={className} style={sizeStyle} />;
    case 'code':
      return <FileCode className={className} style={sizeStyle} />;
    case 'text':
      return <FileText className={className} style={sizeStyle} />;
    default:
      return <FileQuestion className={className} style={sizeStyle} />;
  }
}

export function getFileTypeColor(mimeType: string, fileName: string): string {
  if (!mimeType) return 'text-gray-500 bg-gray-500/10';
  if (mimeType.startsWith('image/')) return 'text-green-500 bg-green-500/10';
  if (mimeType === 'application/pdf') return 'text-red-500 bg-red-500/10';
  if (mimeType.startsWith('video/')) return 'text-purple-500 bg-purple-500/10';
  if (mimeType.startsWith('audio/')) return 'text-orange-500 bg-orange-500/10';
  if (mimeType.startsWith('text/')) return 'text-blue-500 bg-blue-500/10';
  return 'text-gray-500 bg-gray-500/10';
}