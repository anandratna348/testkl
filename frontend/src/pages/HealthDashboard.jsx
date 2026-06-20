import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Shield, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { PageHeader, Badge } from '../components/ui/index.jsx';
import { getCases } from '../services/api.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DOC_LABEL = {
  passport: 'Missing Passport',
  resume: 'Missing Resume / CV',
  degree_certificate: 'Missing Degree Certificate',
  experience_letter: 'Missing Experience Letter',
};

const severityConfig = {
  high:   { bg: 'bg-red-50',    border: 'border-red-200',   icon: 'text-red-500',   badge: 'bg-red-100 text-red-700',     label: 'High Risk' },
  medium: { bg: 'bg-amber-50',  border: 'border-amber-200', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Medium'    },
  low:    { bg: 'bg-blue-50',   border: 'border-slate-200', icon: 'text-slate-400', badge: 'bg-slate-100 text-slate-600', label: 'Low'       },
};

// Map missing doc type → severity based on case health
function docSeverity(health) {
  if (health < 60) return 'high';
  if (health < 80) return 'medium';
  return 'low';
}

const ScoreRing = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const data = [{ value: score, fill: color }, { value: 100 - score, fill: '#f1f5f9' }];
  return (
    <div className="relative w-40 h-40">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{score}</span>
        <span className="text-xs text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  );
};

const CaseHealthRow = ({ c }) => {
  const color = c.health >= 80 ? 'bg-emerald-500' : c.health >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
      <div className="w-12 text-center">
        <div className={`w-2 h-2 rounded-full mx-auto ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono text-brand-600 font-semibold">#{c.id}</span>
          <Badge status={c.status} />
        </div>
        <p className="text-sm font-medium text-slate-800 truncate">{c.client}</p>
        <p className="text-xs text-slate-400">{c.type}</p>
      </div>
      <div className="flex-1 max-w-[120px]">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${c.health}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-1 text-right">{c.health}/100</p>
      </div>
      <Link to={`/cases/${c.id}`} className="text-xs text-brand-600 hover:underline flex items-center gap-1 shrink-0">
        View <ArrowRight size={12} />
      </Link>
    </div>
  );
};

// Map backend tuple → case object
// SELECT * → id, client_name, case_type, priority, status, health_score
const mapCase = (row) => ({
  id: row[0],
  client: row[1],
  type: row[2],
  priority: row[3],
  status: row[4] || 'Active',
  health: row[5] ?? 0,
});

export default function HealthDashboard() {
  const [cases, setCases]         = useState([]);
  const [riskFactors, setRisks]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch real cases
        const raw = await getCases();
        const mapped = (raw || []).map(mapCase);
        setCases(mapped);

        // Build risk factors from cases with missing docs (via /cases/:id)
        const risks = [];
        const seen = new Set();
        // Sort by health ascending so highest risk cases come first
        const sorted = [...mapped].sort((a, b) => a.health - b.health);

        for (const c of sorted.slice(0, 5)) {
          try {
            const res = await fetch(`${BASE_URL}/cases/${c.id}`);
            const data = await res.json();
            const missing = data.missing_documents || [];
            for (const doc of missing) {
              const key = doc;
              if (!seen.has(key)) {
                seen.add(key);
                risks.push({
                  label: DOC_LABEL[doc] || `Missing ${doc}`,
                  impact: `Required for ${c.type} — ${c.client}`,
                  severity: docSeverity(c.health),
                });
              }
            }
          } catch (_) {}
        }
        setRisks(risks.slice(0, 4));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const avgHealth = cases.length ? Math.round(cases.reduce((s, c) => s + c.health, 0) / cases.length) : 0;
  const healthy  = cases.filter(c => c.health >= 80).length;
  const warning  = cases.filter(c => c.health >= 60 && c.health < 80).length;
  const critical = cases.filter(c => c.health < 60).length;
  const sorted   = [...cases].sort((a, b) => a.health - b.health);

  return (
    <div className="fade-in">
      <PageHeader title="Case Health Dashboard" subtitle="Portfolio-wide health monitoring and risk analysis." />

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading health data…
        </div>
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Score Ring */}
            <div className="card p-6 flex flex-col items-center justify-center">
              <ScoreRing score={avgHealth} />
              <p className="text-sm font-semibold text-slate-800 mt-4">Portfolio Health Score</p>
              <p className="text-xs text-slate-400 mt-1">Average across {cases.length} active cases</p>
              <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                avgHealth >= 80 ? 'bg-emerald-50 text-emerald-700' :
                avgHealth >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
              }`}>
                <TrendingUp size={12} />
                {avgHealth >= 80 ? 'Strong performance' : avgHealth >= 60 ? 'Needs attention' : 'Critical review required'}
              </div>
            </div>

            {/* Distribution + Risk Factors */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Healthy Cases',   value: healthy,  sub: '80–100 score',  icon: CheckCircle,  color: 'text-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
                { label: 'Need Attention',  value: warning,  sub: '60–79 score',   icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-50',   ring: 'ring-amber-200'   },
                { label: 'Critical Cases',  value: critical, sub: 'Below 60 score',icon: AlertTriangle,color: 'text-red-500',     bg: 'bg-red-50',     ring: 'ring-red-200'     },
              ].map(({ label, value, sub, icon: Icon, color, bg, ring }) => (
                <div key={label} className={`card p-5 ${bg} ring-1 ${ring} border-transparent`}>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm">
                    <Icon size={20} className={color} />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{value}</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
              ))}

              {/* Risk Factors */}
              <div className="card p-5 sm:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={15} className="text-brand-500" />
                  <h2 className="text-sm font-semibold text-slate-900">Active Risk Factors</h2>
                  <span className="ml-auto text-xs text-slate-400">From highest-risk cases</span>
                </div>
                {riskFactors.length === 0 ? (
                  <p className="text-sm text-emerald-600 text-center py-4">✓ No critical risk factors detected</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {riskFactors.map((risk, i) => {
                      const s = severityConfig[risk.severity];
                      return (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}>
                          <AlertTriangle size={14} className={`${s.icon} shrink-0 mt-0.5`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-slate-800">{risk.label}</p>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{risk.impact}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Per-case health breakdown */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Case Health Breakdown</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" />≥80</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" />60–79</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" />&lt;60</div>
              </div>
            </div>
            <div className="px-5 divide-y divide-slate-50">
              {sorted.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No cases found.</p>
              ) : (
                sorted.map(c => <CaseHealthRow key={c.id} c={c} />)
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}