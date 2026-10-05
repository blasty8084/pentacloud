import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Shield, LogOut, Plus, Trash2, Database, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { MobileBottomSheet } from '../components/MobileBottomSheet';
import { settingsApi } from '../api/client';
import { useState, useEffect } from 'react';

interface B2Account {
  id: string;
  name: string;
  bucket_name: string;
  bucket_endpoint: string;
  max_size_gb: number;
  created_at: string;
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<B2Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    keyId: '',
    appKey: '',
    bucketName: '',
    bucketEndpoint: '',
    maxSizeGb: 10,
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState('');

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
      setFormData({ name: '', keyId: '', appKey: '', bucketName: '', bucketEndpoint: '', maxSizeGb: 10 });
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

  const handleReconcile = async () => {
    setReconcileError('');
    setReconciling(true);
    try {
      await settingsApi.reconcileStorage();
      fetchAccounts();
    } catch (err: any) {
      setReconcileError(err.response?.data?.error || 'Failed to reconcile storage');
    } finally {
      setReconciling(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 h-[56px] bg-surface/80 backdrop-blur-xl border-b border-surface-border flex-shrink-0 md:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:sticky md:top-0 z-40 h-[64px] bg-surface/80 backdrop-blur-xl border-b border-surface-border flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary-light flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-accent-primary" />
            </div>
            <span className="text-xl font-bold text-text-primary">Settings</span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 pb-24 md:pb-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </h2>
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-accent-primary-light flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-accent-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-medium text-text-primary truncate">{user?.name || 'Unnamed User'}</p>
                  <p className="text-text-secondary">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full badge-primary capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {user?.role === 'admin' && (
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backblaze B2 Accounts
                </h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleReconcile}
                    disabled={reconciling}
                    className="gap-1 flex-1 sm:flex-none"
                  >
                    <RefreshCw className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Sync Storage</span>
                  </Button>
                  <Button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Account</span>
                  </Button>
                </div>
              </div>

              {reconcileError && (
                <div className="mb-4 p-3 bg-accent-danger/10 border border-accent-danger/20 rounded-lg text-accent-danger text-sm" role="alert">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {reconcileError}
                </div>
              )}

              {loading ? (
                <div className="card p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-surface-tertiary rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : accounts.length === 0 ? (
                <div className="card p-6 text-center">
                  <Database className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary">No B2 accounts configured</p>
                  <p className="text-sm text-text-tertiary mt-1">Add your first account to start storing files</p>
                  <Button onClick={() => setShowAddModal(true)} className="mt-4 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Add Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map(account => (
                    <div key={account.id} className="card p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-accent-success/10 flex items-center justify-center flex-shrink-0">
                            <Database className="w-6 h-6 text-accent-success" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary truncate">{account.name}</p>
                            <p className="text-sm text-text-tertiary truncate">{account.bucket_name}</p>
                            <p className="text-xs text-text-tertiary mt-1">
                              Endpoint: {account.bucket_endpoint} • {account.max_size_gb}GB limit
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-accent-danger hover:text-accent-danger hover:bg-accent-danger/10 flex-shrink-0"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </h2>
            <div className="card p-6">
              <p className="text-text-secondary">Session management and security settings would go here.</p>
            </div>
          </section>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent-danger" />
                Danger Zone
              </h2>
              <Button variant="danger" onClick={logout} className="w-full sm:w-auto flex-1 sm:flex-none">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
            <div className="card p-6 mt-4">
              <p className="text-text-secondary">Sign out of your PENTACLOUD account.</p>
            </div>
          </section>
        </div>
      </main>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add B2 Account" size="lg">
        <form onSubmit={handleAddAccount} className="space-y-4">
          <Input label="Account Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g., Primary Storage" />
          <Input label="Key ID" value={formData.keyId} onChange={e => setFormData({...formData, keyId: e.target.value})} required />
          <Input label="App Key" type="password" value={formData.appKey} onChange={e => setFormData({...formData, appKey: e.target.value})} required />
          <Input label="Bucket Name" value={formData.bucketName} onChange={e => setFormData({...formData, bucketName: e.target.value})} required />
          <Input label="Bucket Endpoint" value={formData.bucketEndpoint} onChange={e => setFormData({...formData, bucketEndpoint: e.target.value})} required placeholder="e.g., s3.us-east-005.backblazeb2.com" />
          <Input
            label="Max Size (GB)"
            type="number"
            value={formData.maxSizeGb}
            onChange={e => setFormData({...formData, maxSizeGb: parseInt(e.target.value, 10) || 10})}
            min={1}
            max={100}
          />
          {addError && <p className="text-accent-danger text-sm" role="alert">{addError}</p>}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" loading={adding}>Add Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}