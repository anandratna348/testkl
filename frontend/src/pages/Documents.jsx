import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Eye, Download, Loader2, RefreshCw } from 'lucide-react';
import { Badge, PageHeader } from '../components/ui/index.jsx';
import { uploadDocument } from '../services/api.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DOC_LABEL = {
  passport: 'Passport',
  resume: 'Resume / CV',
  degree_certificate: 'Degree Certificate',
  experience_letter: 'Experience Letter',
  unknown: 'Other Document',
};

const fmtSize = bytes =>
  !bytes ? '—' :
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function DocumentUpload() {
  const [dragging, setDragging]   = useState(false);
  const [uploads, setUploads]     = useState([]);
  const [docs, setDocs]           = useState([]);
  const [missing, setMissing]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const inputRef = useRef();

  // ── Fetch real documents ──────────────────────────────
  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/documents/all`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Unknown server error');
      setDocs(data.uploaded || []);
      setMissing(data.missing || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  // ── Upload a file to a specific case ─────────────────
  const processFiles = useCallback(async (files, caseId) => {
    if (!caseId) {
      const firstCase = docs[0]?.case_id || missing[0]?.case_id;
      if (!firstCase) { alert('No cases found. Please create a case first.'); return; }
      caseId = firstCase;
    }

    const fileArr = Array.from(files);
    const newUploads = fileArr.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: fmtSize(file.size),
      type: file.name.split('.').pop().toUpperCase(),
      status: 'uploading',
      progress: 0,
      file,
      caseId,
    }));
    setUploads(prev => [...prev, ...newUploads]);

    for (const u of newUploads) {
      let prog = 0;
      const iv = setInterval(() => {
        prog += Math.random() * 30 + 10;
        if (prog >= 90) { clearInterval(iv); prog = 90; }
        setUploads(prev => prev.map(x => x.id === u.id ? { ...x, progress: Math.min(prog, 90) } : x));
      }, 200);

      try {
        await uploadDocument(u.caseId, u.file);
        clearInterval(iv);
        setUploads(prev => prev.map(x => x.id === u.id ? { ...x, progress: 100, status: 'done' } : x));
      } catch (err) {
        clearInterval(iv);
        setUploads(prev => prev.map(x => x.id === u.id ? { ...x, status: 'error', progress: 0 } : x));
      }
    }
    await loadDocs();
  }, [docs, missing, loadDocs]);

  const onDrop      = useCallback((e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }, [processFiles]);
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onFileChange = (e) => { if (e.target.files?.length) processFiles(e.target.files); };

  const allRows = [...docs, ...missing];

  return (
    <div className="fade-in max-w-3xl">
      <PageHeader title="Document Upload" subtitle="Upload and manage case documents securely." />

      {/* Drop Zone */}
      <div
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`card mb-6 border-2 border-dashed cursor-pointer transition-all p-12 text-center ${
          dragging ? 'border-brand-400 bg-brand-50 shadow-lg scale-[1.01]' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50/60'
        }`}
      >
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" className="hidden" onChange={onFileChange} />
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${dragging ? 'bg-brand-100' : 'bg-slate-100'}`}>
          <Upload size={28} className={dragging ? 'text-brand-500' : 'text-slate-400'} />
        </div>
        <p className="text-base font-semibold text-slate-800 mb-1">{dragging ? 'Drop files to upload' : 'Drag & drop files here'}</p>
        <p className="text-sm text-slate-400 mb-4">or click to browse from your computer</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {['PDF', 'DOCX', 'JPG', 'PNG'].map(t => (
            <span key={t} className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600">{t}</span>
          ))}
          <span className="text-xs text-slate-400">· Max 25 MB per file</span>
        </div>
      </div>

      {/* Active Uploads Progress */}
      {uploads.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              {uploads.every(u => u.status === 'done') ? 'Upload complete' : `Uploading (${uploads.filter(u => u.status === 'uploading').length} remaining)`}
            </h2>
            {uploads.every(u => u.status !== 'uploading') && (
              <button onClick={() => setUploads([])} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {uploads.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                  u.type === 'PDF' ? 'bg-red-50 text-red-600' : u.type === 'DOCX' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'
                }`}>{u.type}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-xs text-slate-400">{u.size}</span>
                      {u.status === 'done' ? <CheckCircle size={15} className="text-emerald-500" />
                       : u.status === 'error' ? <AlertCircle size={15} className="text-red-500" />
                       : <button onClick={(e) => { e.stopPropagation(); setUploads(prev => prev.filter(x => x.id !== u.id)); }}><X size={15} className="text-slate-400 hover:text-slate-600" /></button>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${u.status === 'done' ? 'bg-emerald-500' : u.status === 'error' ? 'bg-red-400' : 'bg-brand-500'}`}
                      style={{ width: `${u.progress}%` }} />
                  </div>
                  {u.status === 'uploading' && <p className="text-xs text-slate-400 mt-1">{Math.round(u.progress)}% uploaded</p>}
                  {u.status === 'error'    && <p className="text-xs text-red-500 mt-1">Upload failed — check file and try again</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Case Documents</h2>
          <div className="flex items-center gap-3">
            {!loading && !error && (
              <span className="text-xs text-slate-400">{docs.length} uploaded · {missing.length} missing</span>
            )}
            <button onClick={loadDocs} className="text-slate-400 hover:text-slate-600" title="Refresh">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading documents…
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 px-6">
            <AlertCircle size={28} className="mx-auto mb-3 text-red-300" />
            <p className="text-sm font-medium mb-1">Failed to load documents</p>
            <p className="text-xs text-slate-400 mb-4 font-mono">{error}</p>
            <button onClick={loadDocs} className="text-xs text-brand-600 hover:underline">Try again</button>
          </div>
        ) : allRows.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No documents yet. Upload your first file above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Document', 'Case', 'Ext', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allRows.map(doc => {
                  const label = DOC_LABEL[doc.document_type] || doc.document_type;
                  const ext = doc.file_ext || '?';
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            doc.status === 'missing' ? 'bg-red-50 text-red-400' :
                            ext === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'
                          }`}>{doc.status === 'missing' ? '?' : ext}</div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{label}</p>
                            {doc.file_name && <p className="text-xs text-slate-400 truncate max-w-[180px]">{doc.file_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium text-slate-700">{doc.client_name}</p>
                        <p className="text-xs text-slate-400">{doc.case_type}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{doc.file_ext || '—'}</td>
                      <td className="px-5 py-3.5"><Badge status={doc.status} /></td>
                      <td className="px-5 py-3.5">
                        {doc.status !== 'missing' ? (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={`${BASE_URL}/uploads/${doc.file_name}`} target="_blank" rel="noreferrer"
                              className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                              <Eye size={12} /> View
                            </a>
                            <a href={`${BASE_URL}/uploads/${doc.file_name}`} download
                              className="text-xs text-slate-500 hover:underline flex items-center gap-1">
                              <Download size={12} /> Save
                            </a>
                          </div>
                        ) : (
                          <label className="text-xs text-red-600 font-medium hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload size={12} /> Upload
                            <input type="file" className="hidden"
                              onChange={(e) => { if (e.target.files?.length) processFiles(e.target.files, doc.case_id); }} />
                          </label>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}