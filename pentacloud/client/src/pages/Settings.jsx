import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Settings, User, Shield, LogOut, Plus, Trash2, Database, Key, HardDrive, Globe, AlertCircle } from 'lucide-react'

export default function Settings() {
  const { user, logout } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    keyId: '',
    applicationKey: '',
    bucketId: '',
    bucketName: '',
    bucketRegion: 'us-west-000',
    maxSizeGb: 10,
  })
  const [adding, setAdding] = useState(false)

  const fetchAccounts = async () => {
    if (user?.role !== 'admin') return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/settings/b2-accounts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async (e) => {
    e.preventDefault()
    setAdding(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/settings/b2-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowAddModal(false)
        setFormData({ name: '', keyId: '', applicationKey: '', bucketId: '', bucketName: '', bucketRegion: 'us-west-000', maxSizeGb: 10 })
        fetchAccounts()
      }
    } catch (err) {
      console.error('Failed to add account:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteAccount = async (id) => {
    if (!confirm('Delete this B2 account? Files stored here will become inaccessible.')) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/settings/b2-accounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      })
      if (res.ok) fetchAccounts()
    } catch (err) {
      console.error('Failed to delete account:', err)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [user])

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6 text-blue-400" />
        Settings
      </h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Account
          </h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">{user?.name || 'Unnamed User'}</p>
                <p className="text-slate-400">{user?.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </section>

        {user?.role === 'admin' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5" />
                Backblaze B2 Accounts
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Account
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-slate-800/50 border border-slate-700 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No B2 accounts configured</p>
                <p className="text-sm text-slate-500 mt-1">Add your first account to start storing files</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map(account => (
                  <div key={account.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Database className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{account.name}</p>
                          <p className="text-sm text-slate-400">{account.bucket_name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Region: {account.bucket_region || 'Unknown'} • {account.max_size_gb}GB limit
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400">Session management and security settings would go here.</p>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Danger Zone
            </h2>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mt-4">
            <p className="text-slate-400">Sign out of your PENTACLOUD account.</p>
          </div>
        </section>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Add B2 Account</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Account Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Primary Storage"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Key ID</label>
                <input
                  type="text"
                  value={formData.keyId}
                  onChange={e => setFormData({ ...formData, keyId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Application Key</label>
                <input
                  type="password"
                  value={formData.applicationKey}
                  onChange={e => setFormData({ ...formData, applicationKey: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bucket ID</label>
                <input
                  type="text"
                  value={formData.bucketId}
                  onChange={e => setFormData({ ...formData, bucketId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bucket Name</label>
                <input
                  type="text"
                  value={formData.bucketName}
                  onChange={e => setFormData({ ...formData, bucketName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bucket Region</label>
                <select
                  value={formData.bucketRegion}
                  onChange={e => setFormData({ ...formData, bucketRegion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="us-west-000">US West (us-west-000)</option>
                  <option value="us-east-001">US East (us-east-001)</option>
                  <option value="eu-central-003">EU Central (eu-central-003)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Max Size (GB)</label>
                <input
                  type="number"
                  value={formData.maxSizeGb}
                  onChange={e => setFormData({ ...formData, maxSizeGb: parseInt(e.target.value, 10) || 10 })}
                  min={1}
                  max={100}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
                <button type="submit" disabled={adding} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                  {adding ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        )}
    </div>
  )
}