import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { filesApi, foldersApi, storageApi } from '../api/client'
import Sidebar from '../components/Sidebar'
import FileGrid from '../components/FileGrid'
import UploadButton from '../components/UploadButton'
import StorageMeter from '../components/StorageMeter'
import ShareModal from '../components/ShareModal'
import { Folder, ChevronRight, Search, Upload, MoreVertical, Download, Edit, Trash2, Share2, Eye, FileText, Image, File, Folder as FolderIcon, Settings, BarChart2, Home, Share, LogOut, X, Plus } from 'lucide-react'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [storageStats, setStorageStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedFile, setSelectedFile] = useState(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [moveModalOpen, setMoveModalOpen] = useState(false)

  const fetchFiles = useCallback(async () => {
    try {
      const params = {}
      if (currentFolderId) params.folderId = currentFolderId
      if (searchQuery) params.search = searchQuery
      const res = await filesApi.list(params)
      setFiles(res.data)
    } catch (err) {
      console.error('Failed to fetch files:', err)
    }
  }, [currentFolderId, searchQuery])

  const fetchFolders = useCallback(async () => {
    try {
      const res = await foldersApi.tree()
      setFolders(res.data)
    } catch (err) {
      console.error('Failed to fetch folders:', err)
    }
  }, [])

  const fetchStorage = useCallback(async () => {
    try {
      const res = await storageApi.stats()
      setStorageStats(res.data)
    } catch (err) {
      console.error('Failed to fetch storage:', err)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
    fetchFolders()
    fetchStorage()
  }, [fetchFiles, fetchFolders, fetchStorage])

  useEffect(() => {
    const timer = setInterval(fetchStorage, 30000)
    return () => clearInterval(timer)
  }, [fetchStorage])

  const handleFileUpload = async (file, folderId) => {
    try {
      await filesApi.upload(file, folderId)
      fetchFiles()
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const handleCreateFolder = async (name, parentId) => {
    try {
      await foldersApi.create({ name, parentId })
      fetchFolders()
      fetchFiles()
    } catch (err) {
      console.error('Create folder failed:', err)
    }
  }

  const handleDownload = async (file) => {
    try {
      const res = await filesApi.download(file.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.original_name)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handlePreview = (file) => {
    navigate(`/preview/${file.id}`)
  }

  const handleRename = async (id, name, type) => {
    try {
      if (type === 'file') {
        await filesApi.update(id, { name })
      } else {
        await foldersApi.update(id, { name })
      }
      fetchFiles()
      fetchFolders()
    } catch (err) {
      console.error('Rename failed:', err)
    }
  }

  const handleMove = async (id, folderId, type) => {
    try {
      if (type === 'file') {
        await filesApi.update(id, { folderId })
      } else {
        await foldersApi.update(id, { parentId: folderId })
      }
      fetchFiles()
      fetchFolders()
    } catch (err) {
      console.error('Move failed:', err)
    }
  }

  const handleDelete = async (id, type) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return
    try {
      if (type === 'file') {
        await filesApi.delete(id)
      } else {
        await foldersApi.delete(id)
      }
      fetchFiles()
      fetchFolders()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleCreateShare = async (fileId, expiresInHours) => {
    try {
      const res = await filesApi.createShare({ fileId, expiresInHours })
      return res.data
    } catch (err) {
      console.error('Create share failed:', err)
      return null
    }
  }

  const openRename = (file) => {
    setSelectedFile(file)
    setRenameValue(file.name)
    setRenameModalOpen(true)
  }

  const openMove = (file) => {
    setSelectedFile(file)
    setMoveModalOpen(true)
  }

  const breadcrumbs = []
  if (currentFolderId) {
    let current = folders.find(f => f.id === currentFolderId)
    while (current) {
      breadcrumbs.unshift(current)
      current = folders.find(f => f.id === current.parent_id)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        collapsed={sidebarCollapsed}
        storageStats={storageStats}
      />

      <main className={`flex-1 flex flex-col ${sidebarCollapsed ? 'ml-16' : 'ml-64'} min-w-0`}>
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              {!sidebarCollapsed && (
                <span className="text-xl font-bold text-blue-400">PENTACLOUD</span>
              )}
            </div>

            <div className="flex-1 max-w-xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={logout} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mb-6">
            <nav className="flex items-center gap-1 text-sm text-slate-400 mb-4" aria-label="Breadcrumb">
              <button
                onClick={() => setCurrentFolderId(null)}
                className="hover:text-white px-2 py-1 rounded flex items-center gap-1"
              >
                <FolderIcon className="w-4 h-4" />
                {!breadcrumbs.length && <span className="font-medium text-white">All Files</span>}
              </button>
              {breadcrumbs.map((folder) => (
                <span key={folder.id} className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  <button
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="hover:text-white px-2 py-1 rounded truncate max-w-[150px]"
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
            </nav>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCreateFolder('New Folder', currentFolderId)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Folder</span>
                </button>
              </div>

              <UploadButton
                folderId={currentFolderId || undefined}
                onUploadComplete={fetchFiles}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <FolderIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No files in this folder</p>
              <p className="text-sm">Drag and drop files above or click to upload</p>
            </div>
          ) : (
            <FileGrid
              files={files}
              viewMode={viewMode}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onRename={openRename}
              onMove={openMove}
              onDelete={handleDelete}
              onShare={(file) => { setSelectedFile(file); setShareModalOpen(true); }}
              onFolderClick={setCurrentFolderId}
              folders={folders}
              currentFolderId={currentFolderId}
            />
          )}

          {shareModalOpen && (
            <ShareModal
              file={selectedFile}
              onCreate={handleCreateShare}
              onClose={() => setShareModalOpen(false)}
            />
          )}

          {renameModalOpen && selectedFile && (
            <RenameModal
              item={selectedFile}
              type="file"
              value={renameValue}
              onChange={setRenameValue}
              onSubmit={() => { handleRename(selectedFile.id, renameValue, 'file'); setRenameModalOpen(false); }}
              onClose={() => setRenameModalOpen(false)}
            />
          )}

          {moveModalOpen && selectedFile && (
            <MoveModal
              item={selectedFile}
              type="file"
              folders={folders}
              currentFolderId={currentFolderId}
              onSubmit={(folderId) => { handleMove(selectedFile.id, folderId, 'file'); setMoveModalOpen(false); }}
              onClose={() => setMoveModalOpen(false)}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function RenameModal({ item, type, value, onChange, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Rename {type}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
            <button onClick={onSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Rename</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MoveModal({ item, type, folders, currentFolderId, onSubmit, onClose }) {
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId)
  const [expandedFolders, setExpandedFolders] = useState(new Set())

  const toggleExpand = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const renderFolders = (folderList, depth = 0) => (
    <div className="space-y-1">
      {folderList.map(folder => (
        <div key={folder.id}>
          {folder.id !== item.id && (
            <button
              onClick={() => setSelectedFolderId(folder.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                selectedFolderId === folder.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              {folder.children && folder.children.length > 0 && (
                <ChevronRight
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id) }}
                />
              )}
              <FolderIcon className="w-4 h-4 flex-shrink-0 text-yellow-400" />
              <span className="truncate">{folder.name}</span>
            </button>
          )}
          {expandedFolders.has(folder.id) && folder.children && (
            <div>{renderFolders(folder.children, depth + 1)}</div>
          )}
        </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Move to Folder</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-300">Move <strong className="text-white">{item.name}</strong> to:</p>
          <div className="max-h-64 overflow-y-auto border border-slate-700 rounded-lg p-2">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                selectedFolderId === null
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <FolderIcon className="w-4 h-4" />
              <span>Root (All Files)</span>
            </button>
            {renderFolders(folders)}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
            <button onClick={() => onSubmit(selectedFolderId)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Move Here</button>
          </div>
        </div>
      </div>
    </div>
  )
}