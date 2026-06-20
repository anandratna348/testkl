import { Bell, Shield, Users, Palette, Key, Globe } from 'lucide-react';
import { PageHeader } from '../components/ui/index.jsx';

const sections = [
  {
    title: 'Notifications', icon: Bell, items: [
      { label: 'Email alerts for high-risk cases', description: 'Receive an email when a case drops below 60 health score', enabled: true },
      { label: 'Deadline reminders', description: 'Get notified 7 days before filing deadlines', enabled: true },
      { label: 'Document upload notifications', description: 'Alert when clients upload new documents', enabled: false },
    ]
  },
  {
    title: 'Security', icon: Shield, items: [
      { label: 'Two-factor authentication', description: 'Add an extra layer of security to your account', enabled: true },
      { label: 'Session timeout', description: 'Auto-logout after 30 minutes of inactivity', enabled: false },
    ]
  },
  {
    title: 'Team & Access', icon: Users, items: [
      { label: 'Allow team document sharing', description: 'Team members can view and download case documents', enabled: true },
      { label: 'Case assignment notifications', description: 'Notify team when cases are reassigned', enabled: true },
    ]
  },
];

function Toggle({ enabled }) {
  return (
    <div className={`w-10 h-5.5 rounded-full flex items-center cursor-pointer transition-colors ${enabled ? 'bg-brand-600' : 'bg-slate-200'}`} style={{ height: '22px' }}>
      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </div>
  );
}

export default function Settings() {
  return (
    <div className="fade-in max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account, notifications, and team preferences." />

      <div className="space-y-4">
        {/* Profile */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Palette size={15} className="text-brand-500" /> Profile
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
              JC
            </div>
            <div>
              <p className="font-semibold text-slate-900">Jennifer Chen</p>
              <p className="text-sm text-slate-400">jennifer@ascendai.com · Senior Case Manager</p>
            </div>
            <button className="btn-secondary ml-auto text-xs py-1.5">Edit Profile</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name</label>
              <input defaultValue="Jennifer Chen" className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input defaultValue="jennifer@ascendai.com" className="input" />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" defaultValue="senior_cm">
                <option value="senior_cm">Senior Case Manager</option>
                <option value="cm">Case Manager</option>
                <option value="attorney">Attorney</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Timezone</label>
              <select className="input" defaultValue="et">
                <option value="et">Eastern Time (ET)</option>
                <option value="ct">Central Time (CT)</option>
                <option value="pt">Pacific Time (PT)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="btn-primary text-sm">Save Changes</button>
          </div>
        </div>

        {/* Toggle sections */}
        {sections.map(({ title, icon: Icon, items }) => (
          <div key={title} className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Icon size={15} className="text-brand-500" /> {title}
            </h2>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  <Toggle enabled={item.enabled} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* API */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Key size={15} className="text-brand-500" /> API & Integrations
          </h2>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-800">API Key</p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">ask_●●●●●●●●●●●●●●●●●●●●</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5">Reveal</button>
              <button className="btn-secondary text-xs py-1.5">Regenerate</button>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-800">Webhook URL</p>
                <p className="text-xs text-slate-400">Not configured</p>
              </div>
            </div>
            <button className="btn-secondary text-xs py-1.5">Configure</button>
          </div>
        </div>
      </div>
    </div>
  );
}