import { HardDrive, Database, AlertCircle, TrendingUp } from 'lucide-react'

export default function StorageMeter({ stats, compact = false }) {
  if (!stats) return null

  const getColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (compact) {
    return (
      <div className="space-y-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Total Storage</p>
              <p className="text-xs text-slate-400">{formatBytes(stats.total.used)} / {formatBytes(stats.total.max)}</p>
            </div>
          </div>
          <span className={`text-lg font-bold ${stats.total.percentage >= 90 ? 'text-red-400' : stats.total.percentage >= 70 ? 'text-yellow-400' : 'text-blue-400'}`}>
            {stats.total.percentage}%
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getColor(stats.total.percentage)}`}
            style={{ width: `${stats.total.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{formatBytes(stats.total.used)} used</span>
          <span>{formatBytes(stats.total.free)} free</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-blue-400" />
            Storage Usage
          </h2>
          <span className={`text-2xl font-bold ${stats.total.percentage >= 90 ? 'text-red-400' : stats.total.percentage >= 70 ? 'text-yellow-400' : 'text-blue-400'}`}>
            {stats.total.percentage}%
          </span>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getColor(stats.total.percentage)}`}
            style={{ width: `${stats.total.percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{formatBytes(stats.total.used)}</p>
            <p className="text-xs text-slate-400">Used</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{formatBytes(stats.total.max)}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{formatBytes(stats.total.free)}</p>
            <p className="text-xs text-slate-400">Free</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Per-Account Breakdown</h3>
        <div className="space-y-3">
          {stats.accounts.map(account => (
            <div key={account.index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{account.name}</p>
                    <p className="text-xs text-slate-400">{account.bucketName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${account.percentage >= 90 ? 'text-red-400' : account.percentage >= 70 ? 'text-yellow-400' : 'text-blue-400'}`}>
                    {account.percentage}%
                  </p>
                  <p className="text-xs text-slate-400">{formatBytes(account.usedSpace)} / {formatBytes(account.maxSpace)}</p>
                </div>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getColor(account.percentage)}`}
                  style={{ width: `${account.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{formatBytes(account.usedSpace)} used</span>
                <span>{formatBytes(account.freeSpace)} free</span>
              </div>
              {account.percentage >= 90 && (
                <div className="flex items-center gap-1 text-xs text-red-400 mt-2">
                  <AlertCircle className="w-3 h-3" />
                  <span>Nearly full - new uploads will route to other accounts</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-700 space-y-2">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">How It Works</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>Files automatically route to the account with the most free space</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>Each account provides 10GB free tier (50GB total)</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>Transparent to you - just upload and go!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}