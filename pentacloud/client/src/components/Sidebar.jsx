import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Folder, HardDrive, Settings, Share2, ChevronRight, ChevronLeft } from 'lucide-react'

export default function Sidebar({ onToggleCollapse, collapsed, storageStats }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set())

  const navItems = [
    { path: '/dashboard', label: 'My Files', icon: <Folder className="w-5 h-5" /> },
    { path: '/storage', label: 'Storage Usage', icon: <HardDrive className="w-5 h-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ]

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  return (
    <aside className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 z-40 flex flex-col ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!collapsed && (
          <span className="text-xl font-bold text-blue-400">PENTACLOUD</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
              ${isActive
                ? 'bg-blue-900/30 text-blue-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? item.label : ''}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        {!collapsed && storageStats && (
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Total Storage</span>
              <span className="font-medium text-white">
                {(storageStats.total.used / 1024 / 1024 / 1024).toFixed(2)} / {(storageStats.total.max / 1024 / 1024 / 1024).toFixed(0)} GB
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${storageStats.total.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Used: {(storageStats.total.used / 1024 / 1024 / 1024).toFixed(2)} GB</span>
              <span>Free: {(storageStats.total.free / 1024 / 1024 / 1024).toFixed(2)} GB</span>
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}