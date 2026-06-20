import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, FileText, Download, RefreshCw, Loader2,
  AlertTriangle, FileX, Gauge,
} from 'lucide-react';
import { PageHeader, Badge } from '../components/ui/index.jsx';
import {
  getCaseDetails, generatePetition, getPetition, getPetitionDownloadUrl,
} from '../services/api.js';

const DOC_LABEL = {
  passport: 'Passport',
  resume: 'Resume / CV',
  degree_certificate: 'Degree Certificate',
  experience_letter: 'Experience Letter',
  unknown: 'Other Document',
};

// Backend SELECT * FROM cases → id, client_name, case_type, priority, status, health_score, ...
const mapCase = (row) => ({
  id: row[0],
  client: row[1],
  type: row[2],
  priority: row[3],
});

// ── Filing Readiness Score ring/bar (mirrors HealthBar styling conventions) ─
const ReadinessScore = ({ score }) => {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-red-700';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[80px]">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-2xl font-bold ${textColor} tabular-nums`}>{score}</span>
    </div>
  );
};

export default function PetitionView() {
  const { id } = useParams(); // case_id

  const [caseData, setCaseData]     = useState(null);
  const [petition, setPetition]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState(null);
  const [genError, setGenError]     = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const caseRes = await getCaseDetails(id);
      if (caseRes.case) setCaseData(mapCase(caseRes.case));

      try {
        const pet = await getPetition(id);
        if (pet.success) setPetition(pet);
        else setPetition(null);
      } catch (_) {
        setPetition(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const result = await generatePetition(id);
      if (result.success) {
        setPetition(result);
      } else {
        setGenError(result.message || 'Petition generation failed');
      }
    } catch (err) {
      setGenError('Petition generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

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

  const missing = petition?.missing_documents?.filter(Boolean) || [];

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to={`/cases/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} /> Back to Case
        </Link>
      </div>

      <PageHeader
        title="AI Petition Generator"
        subtitle={`${caseData.client} · ${caseData.type}`}
      >
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
        >
          {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {generating ? 'Generating…' : petition ? 'Regenerate Petition' : 'Generate Petition'}
        </button>
      </PageHeader>

      {genError && petition && (
        <div className="card p-4 mb-5 border-red-200 bg-red-50/30 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700">{genError}</p>
        </div>
      )}

      {!petition ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No petition generated yet</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Generate a formal petition draft using this case's data, uploaded documents, and AI analysis.
          </p>

          {genError && (
            <div className="mt-4 mx-auto max-w-sm flex items-start gap-2 text-left p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">{genError}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary text-xs py-2 px-4 mt-5 mx-auto disabled:opacity-50"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {generating ? 'Generating…' : 'Generate Petition'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Petition content */}
          <div className="xl:col-span-2 space-y-5">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <FileText size={14} className="text-white" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-900">Petition Draft</h2>
                  <Badge status={petition.status === 'final' ? 'Completed' : 'Pending'} />
                </div>
                <a
                  href={getPetitionDownloadUrl(petition.petition_id)}
                  className="btn-secondary text-xs py-2"
                >
                  <Download size={13} /> Download PDF
                </a>
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                {petition.content}
              </div>
            </div>

            {missing.length > 0 && (
              <div className="card p-5 border-red-200 bg-red-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-500" />
                  <h2 className="text-sm font-semibold text-red-800">Missing Documents ({missing.length})</h2>
                </div>
                <p className="text-xs text-red-600 mb-3">
                  These were missing at the time the petition was generated — upload and regenerate to strengthen the draft.
                </p>
                <div className="space-y-2">
                  {missing.map((docType) => (
                    <div key={docType} className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg border border-red-200">
                      <FileX size={14} className="text-red-400" />
                      <span className="text-sm font-medium text-slate-800">{DOC_LABEL[docType] || docType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filing Readiness Score panel */}
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Gauge size={14} className="text-white" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Filing Readiness</h2>
              </div>

              <p className="text-xs text-slate-400 mb-1.5">Readiness Score</p>
              <ReadinessScore score={petition.filing_readiness_score} />

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Risk Level</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  petition.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                  petition.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>{petition.risk_level}</span>
              </div>

              {petition.recommendations?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recommended Actions</p>
                  <div className="space-y-2">
                    {petition.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-xs bg-slate-50 text-slate-600">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5 text-slate-400" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full btn-secondary text-xs py-2 justify-center mt-4"
              >
                {generating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Regenerate Petition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}