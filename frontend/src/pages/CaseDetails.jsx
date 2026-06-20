import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, FileCheck, FileX, Clock, Sparkles, AlertTriangle,
  CheckCircle, Download, Eye, Upload, User, Calendar, Flag,
  RefreshCw, Loader2, FileText
} from 'lucide-react';
import { Badge, HealthBar } from '../components/ui/index.jsx';
import { getCaseDetails, uploadDocument, analyzeCase, getAnalysis } from '../services/api.js';

// ── Doc type → display label ──────────────────────────────────────────
const DOC_LABEL = {
  passport: 'Passport',
  resume: 'Resume / CV',
  degree_certificate: 'Degree Certificate',
  experience_letter: 'Experience Letter',
  unknown: 'Other Document',
};

// ── Map backend document tuple → object ──────────────────────────────
// Backend returns: [document_type, file_path]
const mapDoc = ([document_type, file_path], idx) => ({
  id: idx,
  name: DOC_LABEL[document_type] || document_type,
  type: document_type,
  file_path,
  status: 'uploaded',
  size: '—',
  uploadedAt: '—',
});

// ── Map backend case tuple → object ──────────────────────────────────
// Backend SELECT * FROM cases → id, client_name, case_type, priority, status, health_score, deadline, last_updated, assignee
const mapCase = (row) => ({
  id: row[0],
  client: row[1],
  type: row[2],
  priority: row[3],
  status: row[4] || 'Active',
  health: row[5] || 0,
  deadline: row[6] ? String(row[6]).split('T')[0] : '—',
  lastUpdated: row[7] || '—',
  assignee: row[8] || '—',
});

// ── DocCard ───────────────────────────────────────────────────────────
const DocCard = ({ doc, onUpload }) => {
  const config = {
    uploaded: { icon: FileCheck, iconColor: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    missing:  { icon: FileX,    iconColor: 'text-red-400',     bg: 'bg-red-50/50',  border: 'border-red-200 border-dashed' },
    under_review: { icon: Clock, iconColor: 'text-amber-500',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  };
  const { icon: Icon, iconColor, bg, border } = config[doc.status] || config.uploaded;

  return (
    <div className={`rounded-xl border p-4 ${bg} ${border} transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm border ${border}`}>
          <Icon size={17} className={iconColor} />
        </div>
        <Badge status={doc.status} />
      </div>
      <p className="text-sm font-semibold text-slate-800 mb-1">{doc.name}</p>
      {doc.status !== 'missing' ? (
        <div className="space-y-1">
          <p className="text-xs text-slate-500">{doc.type}</p>
          <p className="text-xs text-slate-400">{doc.file_path?.split('/').pop()}</p>
          <div className="flex gap-2 mt-2.5">
            <a
              href={`http://localhost:8000/uploads/${doc.file_path?.split('/').pop()}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-brand-600 font-medium hover:underline"
            >
              <Eye size={12} /> View
            </a>
            <a
              href={`http://localhost:8000/uploads/${doc.file_path?.split('/').pop()}`}
              download
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <Download size={12} /> Download
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-xs text-red-600 mb-2">Not yet uploaded</p>
          <label className="flex items-center gap-1 text-xs text-red-600 font-medium hover:underline cursor-pointer">
            <Upload size={12} /> Upload now
            <input type="file" className="hidden" onChange={(e) => onUpload(e.target.files[0], doc.type)} />
          </label>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────
export default function CaseDetails() {
  const { id } = useParams();

  const [caseData, setCaseData]   = useState(null);
  const [documents, setDocuments] = useState([]);
  const [analysis, setAnalysis]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [liveMissing, setLiveMissing] = useState([]);
  const [error, setError]         = useState(null);

  // ── Fetch case + documents + latest AI result ──────────────────────
  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCaseDetails(id);

      if (data.case) {
        const mapped = mapCase(data.case);
        // Use live health score from backend (recalculated on every fetch)
        if (data.live_health_score !== undefined) mapped.health = data.live_health_score;
        setCaseData(mapped);
      }

      // Set live missing docs from backend (no AI analysis needed)
      if (data.missing_documents) setLiveMissing(data.missing_documents);

      if (data.documents?.length) {
        setDocuments(data.documents.map(mapDoc));
      } else {
        setDocuments([]);
      }

      // Fetch latest AI analysis if exists
      try {
        const ai = await getAnalysis(id);
        if (ai.success) setAnalysis(ai);
      } catch (_) {}

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  // ── Upload handler ─────────────────────────────────────────────────
  const handleUpload = async (file, docType) => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocument(id, file);
      await fetchAll();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── AI Analysis handler ────────────────────────────────────────────
  const handleAnalyze = async () => {
    setAiLoading(true);
    try {
      const result = await analyzeCase(id);
      if (result.success) {
        setAnalysis(result);
        // Refresh case for updated health score
        await fetchAll();
      } else {
        alert(result.message || 'AI analysis failed');
      }
    } catch (err) {
      alert('AI analysis failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Loading / Error ────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-brand-500" />
    </div>
  );

  if (error || !caseData) return (
    <div className="text-center py-20 text-red-500">
      <p>{error || 'Case not found'}</p>
      <Link to="/cases" className="text-sm text-brand-600 mt-2 inline-block">← Back to Cases</Link>
    </div>
  );

  // Merge: live missing (always available) + AI analysis missing
  const missing = liveMissing.length > 0 ? liveMissing : (analysis?.missing_documents?.filter(Boolean) || []);

  return (
    <div className="fade-in">
      {/* Back */}
      <div className="mb-4">
        <Link to="/cases" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} /> Back to Cases
        </Link>
      </div>

      {/* Header */}
      <div className="card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                #{caseData.id}
              </span>
              <Badge status={caseData.status} />
              <span className="text-xs text-slate-400">Priority: <strong className="text-slate-700">{caseData.priority}</strong></span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{caseData.client}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{caseData.type}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Case Health</p>
              <div className="flex items-center gap-3">
                <div className="w-32"><HealthBar score={caseData.health} /></div>
                <span className="text-2xl font-bold text-slate-900">{caseData.health}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <label className={`btn-secondary text-xs py-2 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                Upload Docs
                <input type="file" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} disabled={uploading} />
              </label>
              <button
                onClick={handleAnalyze}
                disabled={aiLoading || documents.length === 0}
                className="btn-primary text-xs py-2 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {aiLoading ? 'Analyzing…' : 'AI Analysis'}
              </button>
              <Link to={`/cases/${id}/petition`} className="btn-secondary text-xs py-2">
                <FileText size={13} /> Petition
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">

          {/* Client Info */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User size={15} className="text-brand-500" /> Client Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Full Name',       value: caseData.client },
                { label: 'Case Type',       value: caseData.type },
                { label: 'Assigned To',     value: caseData.assignee },
                { label: 'Filing Deadline', value: caseData.deadline },
                { label: 'Priority',        value: caseData.priority },
                { label: 'Last Updated',    value: String(caseData.lastUpdated).split('T')[0] },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Uploaded Documents</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{documents.length} uploaded</span>
                <button onClick={fetchAll} className="text-slate-400 hover:text-slate-600">
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
            {documents.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-sm">No documents uploaded yet.</p>
                <label className="mt-3 inline-flex items-center gap-1 text-xs text-brand-600 font-medium hover:underline cursor-pointer">
                  <Upload size={12} /> Upload first document
                  <input type="file" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((doc) => (
                  <DocCard key={doc.id} doc={doc} onUpload={handleUpload} />
                ))}
              </div>
            )}
          </div>

          {/* Missing Docs Alert (from AI analysis) */}
          {missing.length > 0 && (
            <div className="card p-5 border-red-200 bg-red-50/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="text-sm font-semibold text-red-800">Missing Documents ({missing.length})</h2>
              </div>
              <p className="text-xs text-red-600 mb-3">Required to proceed with this case:</p>
              <div className="space-y-2">
                {missing.map((docType) => (
                  <div key={docType} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <FileX size={14} className="text-red-400" />
                      <span className="text-sm font-medium text-slate-800">
                        {DOC_LABEL[docType] || docType}
                      </span>
                    </div>
                    <label className="text-xs text-brand-600 font-medium hover:underline cursor-pointer">
                      Upload →
                      <input type="file" className="hidden" onChange={(e) => handleUpload(e.target.files[0], docType)} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Panel */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">AI Analysis</h2>
            </div>

            {!analysis ? (
              <div className="text-center py-8 text-slate-400">
                <Sparkles size={24} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm mb-1">No analysis yet</p>
                <p className="text-xs text-slate-400 mb-4">Upload documents and click AI Analysis to get insights.</p>
                <button
                  onClick={handleAnalyze}
                  disabled={aiLoading || documents.length === 0}
                  className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {aiLoading ? 'Analyzing…' : 'Run AI Analysis'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Case Summary</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary || analysis.analysis}</p>
                </div>

                {analysis.missing_documents?.filter(Boolean).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Missing Documents</p>
                    <div className="space-y-1.5">
                      {analysis.missing_documents.filter(Boolean).map((doc, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                          <FileX size={12} className="text-red-400 mt-0.5 shrink-0" />
                          {DOC_LABEL[doc] || doc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recommended Actions</p>
                    <div className="space-y-2">
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                          i < 2 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-50 text-slate-600'
                        }`}>
                          <AlertTriangle size={12} className={`shrink-0 mt-0.5 ${i < 2 ? 'text-red-400' : 'text-slate-400'}`} />
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Risk Level</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    analysis.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                    analysis.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>{analysis.risk_level}</span>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={aiLoading}
                  className="w-full btn-secondary text-xs py-2 justify-center"
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Re-run Analysis
                </button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <Link to="/assistant" className="btn-primary w-full justify-center text-xs py-2.5">
                <Sparkles size={13} /> Ask AI About This Case
              </Link>
              <Link to={`/cases/${id}/petition`} className="btn-secondary w-full justify-center text-xs py-2.5">
                <FileText size={13} /> Generate Petition
              </Link>
            </div>
          </div>

          {/* Case Metrics */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Case Metrics</p>
            <div className="space-y-3">
              {[
                { label: 'Documents uploaded',  value: documents.length,      color: 'text-emerald-600' },
                { label: 'Missing documents',   value: missing.length,        color: missing.length > 0 ? 'text-red-500' : 'text-emerald-600' },
                { label: 'Health score',        value: `${caseData.health}%`, color: 'text-brand-600' },
                { label: 'Risk level',          value: analysis?.risk_level || '—', color: 'text-amber-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}