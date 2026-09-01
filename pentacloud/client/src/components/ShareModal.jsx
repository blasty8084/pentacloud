import { useState } from 'react'
import { X, Copy, Check, ExternalLink, Clock } from 'lucide-react'

export default function ShareModal({ file, onCreate, onClose }) {
  const [expiresInHours, setExpiresInHours] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const hours = expiresInHours ? parseInt(expiresInHours, 10) : undefined
      const result = await onCreate(file.id, hours)
      if (result) {
        setShareUrl(result.shareUrl)
        setCopied(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Create Share Link</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-300">
            Create a shareable download link for <strong className="text-white">{file.name}</strong>
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Expires in (hours, optional)</label>
            <input
              type="number"
              value={expiresInHours}
              onChange={e => setExpiresInHours(e.target.value)}
              placeholder="Leave empty for no expiry"
              min={1}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-500">Maximum 8760 hours (1 year)</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                'Create Link'
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>

          {shareUrl && (
            <div className="space-y-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
              <p className="text-xs font-medium text-slate-400">Shareable Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 text-slate-400 hover:text-green-400 rounded-lg hover:bg-slate-700"
                  aria-label={copied ? 'Copied' : 'Copy to clipboard'}
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              {expiresInHours && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires in {expiresInHours} hour{expiresInHours !== '1' ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}