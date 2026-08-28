import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Shield, LogOut, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { settingsApi } from '../api/client';
import { useState } from 'react';

interface B2Account {
  id: string;
  name: string;
  bucket_name: string;
  bucket_region: string;
  max_size_gb: number;
  created_at: number;
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<B2Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    keyId: '',
    applicationKey: '',
    bucketId: '',
    bucketName: '',
    bucketRegion: '',
    maxSizeGb: 10,
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchAccounts = async () => {
    if (user?.role !== 'admin') return;
    try {
      const response = await settingsApi.getB2Accounts();
      setAccounts(response.data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    try {
      await settingsApi.addB2Account(formData);
      setShowAddModal(false);
      setFormData({ name: '', keyId: '', applicationKey: '', bucketId: '', bucketName: '', bucketRegion: '', maxSizeGb: 10 });
      fetchAccounts();
    } catch (err: any) {
      setAddError(err.response?.data?.error || 'Failed to add account');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Delete this B2 account? Files stored here will become inaccessible.')) return;
    try {
      await settingsApi.deleteB2Account(id);
      fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Settings</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">{user?.name || 'Unnamed User'}</p>
                  <p className="text-gray-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {user?.role === 'admin' && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backblaze B2 Accounts
                </h2>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4" />
                  Add Account
                </Button>
              </div>

              {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : accounts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No B2 accounts configured</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first account to start storing files</p>
                  <Button onClick={() => setShowAddModal(true)} className="mt-4">
                    <Plus className="w-4 h-4" />
                    Add Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map(account => (
                    <div key={account.id} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <Database className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{account.name}</p>
                            <p className="text-sm text-gray-500">{account.bucket_name}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Region: {account.bucket_region || 'Unknown'} • {account.max_size_gb}GB limit
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-600">Session management and security settings would go here.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                Danger Zone
              </h2>
              <Button variant="danger" onClick={logout}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
              <p className="text-gray-600">Sign out of your PENTACLOUD account.</p>
            </div>
          </section>
        </div>
      </main>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add B2 Account" size="lg">
        <form onSubmit={handleAddAccount} className="space-y-4">
          <Input label="Account Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g., Primary Storage" />
          <Input label="Key ID" value={formData.keyId} onChange={e => setFormData({...formData, keyId: e.target.value})} required />
          <Input label="Application Key" type="password" value={formData.applicationKey} onChange={e => setFormData({...formData, applicationKey: e.target.value})} required />
          <Input label="Bucket ID" value={formData.bucketId} onChange={e => setFormData({...formData, bucketId: e.target.value})} required />
          <Input label="Bucket Name" value={formData.bucketName} onChange={e => setFormData({...formData, bucketName: e.target.value})} required />
          <Input label="Bucket Region (optional)" value={formData.bucketRegion} onChange={e => setFormData({...formData, bucketRegion: e.target.value})} placeholder="e.g., us-west-000" />
          <Input
            label="Max Size (GB)"
            type="number"
            value={formData.maxSizeGb}
            onChange={e => setFormData({...formData, maxSizeGb: parseInt(e.target.value, 10) || 10})}
            min={1}
            max={100}
          />
          {addError && <p className="text-red-600 text-sm">{addError}</p>}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" loading={adding}>Add Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { Database } from 'lucide-react';