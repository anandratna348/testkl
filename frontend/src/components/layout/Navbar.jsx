import { useState } from 'react';
import { Search, Bell, Menu, ChevronDown, Settings, LogOut, User } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = [
    { id: 1, text: 'ASC-2403 flagged as high risk', time: '2m ago', unread: true },
    { id: 2, text: 'New document uploaded for ASC-2401', time: '1h ago', unread: true },
    { id: 3, text: 'Deadline in 3 days: ASC-2406', time: '3h ago', unread: false },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4 shrink-0 relative z-20">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-lg relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search cases, clients, documents..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all placeholder:text-slate-400"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-300 font-mono hidden sm:block">⌘K</kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                <button className="text-xs text-brand-600 font-medium hover:underline">Mark all read</button>
              </div>
              <div className="divide-y divide-slate-50">
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${n.unread ? 'bg-brand-50/40' : ''}`}>
                    <div className="flex items-start gap-2.5">
                      {n.unread && <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 shrink-0" />}
                      <div className={n.unread ? '' : 'ml-4'}>
                        <p className="text-sm text-slate-800">{n.text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100">
                <button className="text-sm text-brand-600 font-medium hover:underline w-full text-center">View all</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
              JC
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">Jennifer</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl fade-in">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Jennifer Chen</p>
                <p className="text-xs text-slate-400">jennifer@ascendai.com</p>
              </div>
              <div className="py-1">
                {[
                  
                  { icon: Settings, label: 'Settings' },
                ].map(({ icon: Icon, label }) => (
                  <button key={label} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <Icon size={15} className="text-slate-400" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}