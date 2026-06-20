import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, FilePlus, Upload,
  Bot, Activity, Settings, Zap, ChevronRight, X
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases', label: 'Cases', icon: FolderOpen },
  { to: '/create-case', label: 'Create Case', icon: FilePlus },
  { to: '/documents', label: 'Documents', icon: Upload },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/health', label: 'Health Dashboard', icon: Activity },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 w-64 bg-white border-r border-slate-200 flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-700 text-slate-900 font-bold leading-none">AscendAI</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase leading-none mt-0.5">Case Copilot</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Main</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link group ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={17} className="shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}

          <div className="pt-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">System</p>
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => `sidebar-link group ${isActive ? 'active' : ''}`}
            >
              <Settings size={17} className="shrink-0" />
              <span className="flex-1">Settings</span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          </div>
        </nav>

        {/* Bottom user card */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              JC
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">Jennifer Chen</p>
              <p className="text-xs text-slate-400 truncate">Senior Case Manager</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}