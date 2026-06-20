import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { PageHeader } from '../components/ui/index.jsx';
import { getFirmProfile, saveFirmProfile } from '../services/api.js';

export default function Settings() {
  const [profile, setProfile] = useState({
    attorney_name: '',
    attorney_title: '',
    law_firm_name: '',
    bar_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    let cancelled = false;
    getFirmProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile({
          attorney_name: data.attorney_name || '',
          attorney_title: data.attorney_title || '',
          law_firm_name: data.law_firm_name || '',
          bar_number: data.bar_number || '',
        });
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  function handleChange(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);
    try {
      await saveFirmProfile(profile);
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 2500);
    }
  }

  return (
    <div className="fade-in max-w-2xl">
      <PageHeader title="Settings" subtitle="Update the attorney details used to auto-fill generated petitions." />

      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User size={15} className="text-brand-500" /> Attorney Details
          </h2>
          <p className="text-xs text-slate-400 mb-4 -mt-2">
            These fields are inserted into the signature block of every petition you generate.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Attorney Name</label>
              <input
                value={profile.attorney_name}
                onChange={(e) => handleChange('attorney_name', e.target.value)}
                className="input"
                placeholder="e.g. Jennifer Chen, Esq."
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Attorney Title</label>
              <input
                value={profile.attorney_title}
                onChange={(e) => handleChange('attorney_title', e.target.value)}
                className="input"
                placeholder="e.g. Managing Partner"
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Law Firm Name</label>
              <input
                value={profile.law_firm_name}
                onChange={(e) => handleChange('law_firm_name', e.target.value)}
                className="input"
                placeholder="e.g. Chen Immigration Law Group"
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Bar Number</label>
              <input
                value={profile.bar_number}
                onChange={(e) => handleChange('bar_number', e.target.value)}
                className="input"
                placeholder="e.g. 123456"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            {saveStatus === 'success' && <span className="text-xs text-emerald-600">Saved</span>}
            {saveStatus === 'error' && <span className="text-xs text-red-500">Failed to save</span>}
            <button className="btn-primary text-sm" onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}