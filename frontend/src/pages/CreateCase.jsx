import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Save, FilePlus } from 'lucide-react';
import { PageHeader } from '../components/ui/index.jsx';
import { createCase } from '../services/api.js';

const CASE_TYPES = ['H-1B Visa', 'H-4 EAD', 'L-1 Visa', 'O-1 Visa', 'E-3 Visa', 'TN Visa', 'Green Card (EB-2)', 'Green Card (EB-3)', 'EB-2 NIW', 'PERM Labor Certification', 'Asylum', 'Family Petition'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// Moved outside CreateCase to prevent re-creation on every render (fixes cursor/focus loss)
const Field = ({ label, id, error, children }) => (
  <div>
    <label htmlFor={id} className="label">{label}</label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
        <AlertCircle size={12} /> {error}
      </p>
    )}
  </div>
);

export default function CreateCase() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    clientName: '',
    caseType: '',
    priority: '',
    deadline: '',
    email: '',
    phone: '',
    nationality: '',
    notes: '',
  });

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = 'Client name is required';
    if (!form.caseType) e.caseType = 'Please select a case type';
    if (!form.priority) e.priority = 'Please select a priority';
    if (!form.deadline) e.deadline = 'Deadline is required';
    return e;
  };

  const handleCreate = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setApiError(null);
    try {
      await createCase({
        client_name: form.clientName,
        case_type: form.caseType,
        priority: form.priority,
      });
      navigate('/cases');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraft = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="fade-in max-w-3xl">
      <PageHeader title="Create New Case" subtitle="Fill in the client information to open a new case file." />

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-5 text-emerald-700 text-sm fade-in">
          <CheckCircle size={16} />
          Draft saved successfully
        </div>
      )}

      {apiError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-red-700 text-sm fade-in">
          <AlertCircle size={16} />
          {apiError}
        </div>
      )}

      <div className="space-y-4">
        {/* Client Information */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">Client Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Client Full Name *" id="clientName" error={errors.clientName}>
              <input
                id="clientName"
                value={form.clientName}
                onChange={e => set('clientName', e.target.value)}
                placeholder="e.g. Priya Sharma"
                className={`input ${errors.clientName ? 'border-red-300 focus:ring-red-400' : ''}`}
              />
            </Field>
            <Field label="Email Address" id="email">
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="client@email.com"
                className="input"
              />
            </Field>
            <Field label="Phone Number" id="phone">
              <input
                id="phone"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="input"
              />
            </Field>
            <Field label="Nationality" id="nationality">
              <input
                id="nationality"
                value={form.nationality}
                onChange={e => set('nationality', e.target.value)}
                placeholder="e.g. Indian"
                className="input"
              />
            </Field>
          </div>
        </div>

        {/* Case Details */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">Case Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Case Type *" id="caseType" error={errors.caseType}>
              <select
                id="caseType"
                value={form.caseType}
                onChange={e => set('caseType', e.target.value)}
                className={`input ${errors.caseType ? 'border-red-300 focus:ring-red-400' : ''}`}
              >
                <option value="">Select case type...</option>
                {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="Priority *" id="priority" error={errors.priority}>
              <select
                id="priority"
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className={`input ${errors.priority ? 'border-red-300 focus:ring-red-400' : ''}`}
              >
                <option value="">Select priority...</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>

            <Field label="Filing Deadline *" id="deadline" error={errors.deadline}>
              <input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
                className={`input ${errors.deadline ? 'border-red-300 focus:ring-red-400' : ''}`}
              />
            </Field>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">Case Notes</h2>
          <Field label="Additional Notes" id="notes">
            <textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Add relevant context, special circumstances, or instructions for the case team..."
              className="input resize-none"
            />
          </Field>
          <p className="text-xs text-slate-400 mt-2">Notes are visible to all case team members.</p>
        </div>

        {form.priority === 'Urgent' && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl fade-in">
            <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Urgent priority selected</p>
              <p className="text-xs text-red-600 mt-0.5">This case will be flagged immediately and appear at the top of your team's queue.</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="btn-primary py-3 flex-1 sm:flex-none sm:px-8 justify-center text-sm disabled:opacity-60"
          >
            <FilePlus size={16} />
            {submitting ? 'Creating...' : 'Create Case'}
          </button>
          <button onClick={handleDraft} className="btn-secondary py-3 flex-1 sm:flex-none sm:px-8 justify-center text-sm">
            <Save size={16} />
            Save Draft
          </button>
          <button onClick={() => navigate('/cases')} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-3 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}