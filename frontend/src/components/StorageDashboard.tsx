import { useEffect, useState } from 'react';
import { X, HardDrive, Database, TrendingUp, AlertCircle } from 'lucide-react';
import { storageApi } from '../api/client';

interface StorageAccount {
  id: string;
  name: string;
  bucketName: string;
  used: number;
  max: number;
  free: number;
  percentage: number;
}

interface StorageStats {
  total: {
    used: number;
    max: number;
    free: number;
    percentage: number;
  };
  accounts: StorageAccount[];
}

interface StorageDashboardProps {
  onClose: () => void;
}

export function StorageDashboard({ onClose }: StorageDashboardProps) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await storageApi.stats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch storage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-6 max-w-2xl w-full mx-4 sm:mx-auto shadow-xl animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Storage Dashboard</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-6 max-w-2xl w-full mx-4 sm:mx-auto shadow-xl animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Storage Dashboard</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-gray-500">Failed to load storage stats</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-t-2xl sm:rounded-xl p-6 max-w-2xl w-full mx-4 sm:mx-auto shadow-xl animate-slide-up max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Storage Dashboard</h2>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Storage</p>
            <p className="text-3xl font-bold">{formatBytes(stats.total.used)} / {formatBytes(stats.total.max)}</p>
            <p className="text-blue-200 text-sm mt-1">{stats.total.percentage}% used</p>
          </div>
          <div className="w-20 h-20 rounded-full border-4 border-blue-300 border-t-transparent flex items-center justify-center">
            <HardDrive className="w-10 h-10" />
          </div>
        </div>
        <div className="mt-4 h-2 bg-blue-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${stats.total.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-blue-200 mt-2">
          <span>{formatBytes(stats.total.used)} used</span>
          <span>{formatBytes(stats.total.free)} free</span>
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Per-Account Breakdown</h3>
      <div className="space-y-4">
        {stats.accounts.map(account => (
          <div key={account.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{account.name}</p>
                  <p className="text-xs text-gray-500">{account.bucketName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{account.percentage}%</p>
                <p className="text-xs text-gray-500">{formatBytes(account.used)} / {formatBytes(account.max)}</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(account.percentage)}`}
                style={{ width: `${account.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatBytes(account.used)} used</span>
              <span>{formatBytes(account.free)} free</span>
            </div>
            {account.percentage >= 90 && (
              <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
                <AlertCircle className="w-3 h-3" />
                <span>Nearly full - new uploads will route to other accounts</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">How It Works</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Files automatically route to the account with the most free space</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Each account provides 10GB free tier (50GB total)</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Transparent to you - just upload and go!</span>
          </div>
        </div>
      </div>
    </div>
  );
}