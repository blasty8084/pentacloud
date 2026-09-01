import { useState, useRef } from 'react'
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { filesApi } from '../api/client'
import { useUpload } from '../context/UploadContext'

export default function UploadButton({ folderId, onUploadComplete }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewFiles, setPreviewFiles] = useState([])
  const fileInputRef = useRef(null)
  const { addUpload, updateProgress, completeUpload, errorUpload, removeUpload, uploads } = useUpload()

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    await processFiles(files)
  }

  const handleFileSelect = async (e) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    await processFiles(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const processFiles = async (files) => {
    for (const file of files) {
      const fileId = addUpload(file)
      setPreviewFiles(prev => [...prev, file])
      try {
        const formData = new FormData()
        formData.append('file', file)
        if (folderId) formData.append('folderId', folderId)

        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded * 100) / e.total)
            updateProgress(fileId, progress)
          }
        })

        await new Promise((resolve, reject) => {
          xhr.open('POST', `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/files/upload`, true)
          const token = localStorage.getItem('accessToken')
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              completeUpload(fileId)
              resolve()
            } else {
              errorUpload(fileId, `Upload failed: ${xhr.statusText}`)
              reject(new Error(xhr.statusText))
            }
          }
          xhr.onerror = () => {
            errorUpload(fileId, 'Network error')
            reject(new Error('Network error'))
          }
          xhr.send(formData)
        })

        if (onUploadComplete) onUploadComplete()
      } catch (err) {
        console.error('Upload error:', err)
      } finally {
        setTimeout(() => removeUpload(fileId), 3000)
      }
    }
    setPreviewFiles([])
  }

  const openFileDialog = () => fileInputRef.current?.click()

  const activeUploads = uploads.filter(u => u.status !== 'completed')

  if (previewFiles.length === 0 && activeUploads.length === 0) {
    return (
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          isDragOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload className="w-12 h-12 mx-auto text-slate-500 mb-3" />
        <p className="text-slate-300 font-medium">Drag & drop files here, or click to browse</p>
        <p className="text-xs text-slate-500 mt-1">Max 5GB per file</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {previewFiles.map((file, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
            <File className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            onClick={() => setPreviewFiles(prev => prev.filter((_, i) => i !== index))}
            className="p-1 text-slate-400 hover:text-red-400 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      {activeUploads.map(upload => (
        <div key={upload.fileId} className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            {upload.status === 'uploading' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
            {upload.status === 'pending' && <Upload className="w-5 h-5 text-blue-400" />}
            {upload.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {upload.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{upload.fileName}</p>
            <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  upload.status === 'error' ? 'bg-red-500' : upload.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            {upload.status === 'error' && <p className="text-xs text-red-400 mt-1">{upload.error}</p>}
          </div>
          {upload.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400" />}
        </div>
      ))}
    </div>
  )
}