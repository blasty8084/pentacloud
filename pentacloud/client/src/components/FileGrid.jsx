import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Download, Edit, Trash2, Share2, Eye, FileText, Image, File, Folder, ChevronRight } from 'lucide-react'

export default function FileGrid({ files, viewMode, onDownload, onPreview, onRename, onMove, onDelete, onShare, folders, currentFolderId, onFolderClick }) {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, file: null })

  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, visible: false })
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [contextMenu])

  const handleRightClick = (e, file) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, file })
  }

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-10 h-10 text-green-400" />
    if (mimeType === 'application/pdf') return <FileText className="w-10 h-10 text-red-400" />
    if (mimeType?.startsWith('text/')) return <FileText className="w-10 h-10 text-blue-400" />
    return <File className="w-10 h-10 text-slate-400" />
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const childFolders = folders?.filter(f => f.parent_id === currentFolderId) || []

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {childFolders.map(folder => (
          <div
            key={folder.id}
            className="group bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer"
            onClick={() => onFolderClick?.(folder.id)}
            onContextMenu={(e) => handleRightClick(e, { ...folder, isFolder: true })}
          >
            <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
              <Folder className="w-12 h-12 text-yellow-400" />
            </div>
            <p className="text-sm font-medium text-white truncate text-center">{folder.name}</p>
            <p className="text-xs text-slate-500 text-center mt-1">Folder</p>
          </div>
        ))}
        {files.map(file => (
          <div
            key={file.id}
            className="group bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer relative"
            onDoubleClick={() => onPreview(file)}
            onContextMenu={(e) => handleRightClick(e, file)}
          >
            <div className="aspect-square bg-slate-700/50 rounded-lg flex items-center justify-center mb-3 overflow-hidden relative">
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
            <p className="text-sm font-medium text-white truncate" title={file.name}>{file.name}</p>
            <p className="text-xs text-slate-400 mt-1">{formatSize(file.size)}</p>
            <p className="text-xs text-slate-500">{formatDate(file.created_at)}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3 hidden sm:table-cell">Size</th>
            <th className="px-4 py-3 hidden md:table-cell">Modified</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {childFolders.map(folder => (
            <tr key={folder.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer" onClick={() => onFolderClick?.(folder.id)}>
              <td className="px-4 py-3 flex items-center gap-3">
                <Folder className="w-5 h-5 text-yellow-400" />
                <span className="font-medium text-white">{folder.name}</span>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-slate-400">—</td>
              <td className="px-4 py-3 hidden md:table-cell text-slate-400">{formatDate(folder.created_at)}</td>
              <td className="px-4 py-3">
                <ContextMenu file={{ ...folder, isFolder: true }} onRename={onRename} onMove={onMove} onDelete={onDelete} />
              </td>
            </tr>
          ))}
          {files.map(file => (
            <tr key={file.id} className="border-b border-slate-800/50 hover:bg-slate-800/50" onContextMenu={(e) => handleRightClick(e, file)}>
              <td className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.mime_type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white truncate max-w-xs" title={file.name}>{file.name}</p>
                  <p className="text-xs text-slate-500">{formatDate(file.created_at)}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400 hidden sm:table-cell">{formatSize(file.size)}</td>
              <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">{formatDate(file.created_at)}</td>
              <td className="px-4 py-3">
                <ContextMenu file={file} onDownload={onDownload} onPreview={onPreview} onRename={onRename} onMove={onMove} onDelete={onDelete} onShare={onShare} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ContextMenu({ file, onDownload, onPreview, onRename, onMove, onDelete, onShare }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (file.isFolder) {
    return (
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen(!open)} className="p-1 text-slate-400 hover:text-white">
          <MoreVertical className="w-5 h-5" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 z-50 min-w-[140px] animate-fadeIn">
            <button onClick={() => { onRename(file); setOpen(false) }} className="w-full px-3 py-2 text-sm flex items-center gap-2 text-slate-300 hover:bg-slate-700">
              <Edit className="w-4 h-4" /> Rename
            </button>
            <button onClick={() => { onMove(file); setOpen(false) }} className="w-full px-3 py-2 text-sm flex items-center gap-2 text-slate-300 hover:bg-slate-700">
              <Share2 className="w-4 h-4" /> Move
            </button>
            <button onClick={() => { onDelete(file.id, 'folder'); setOpen(false) }} className="w-full px-3 py-2 text-sm flex items-center gap-2 text-red-400 hover:bg-slate-700">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1 text-slate-400 hover:text-white">
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 z-50 min-w-[160px] animate-fadeIn">
          <button onClick={() => { onPreview(file); setOpen(false) }} className="w-full px-3 py-2 text-sm flex items-center gap-2 text-slate-300 hover:bg-slate-700">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={() => { onDownload(file); setOpen(false) }} className="w-full px-3 py-2 text-sm flex items-center gap-2 text-slate-300 hover:bg-slate-700">
            <Download className="w-4 h-4" /> Download
          </button>
          <button onClick={() => { onShare(file); setOpen(false) }} className="w-full px-3 py-2 text-sm flex items-center gap-2 text-slate-300 hover:bg-slate-700">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={() => { onRename(file); setOpen(false) }} className="w-full px-3 py-2 text-sm flex items-center gap-2 text-slate-300 hover:bg-slate-700">
            <Edit className="w-4 h-4" /> Rename
          </button>
          <button onClick={() => { onMove(file); setOpen(false) }} className="w-full px-3 py-2 text-sm flex items-center gap-2 text-slate-300 hover:bg-slate-700">
            <Share2 className="w-4 h-4" /> Move
          </button>
          <button onClick={() => { onDelete(file.id, 'file'); setOpen(false) }} className="w-full px-3 py-2 text-sm flex items-center gap-2 text-red-400 hover:bg-slate-700">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}