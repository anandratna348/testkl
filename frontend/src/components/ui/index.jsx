import { TrendingUp, TrendingDown } from 'lucide-react';

export function Badge({ status }) {
  const styles = {
    'Active': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    'Review': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    'High Risk': 'bg-red-50 text-red-700 ring-1 ring-red-200',
    'Pending': 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    'Completed': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    'uploaded': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    'missing': 'bg-red-50 text-red-700 ring-1 ring-red-200',
    'under_review': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  };
  const labels = {
    'uploaded': 'Uploaded',
    'missing': 'Missing',
    'under_review': 'Under Review',
  };
  return (
    <span className={`badge ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
}

export function HealthBar({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-red-700';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[48px]">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${textColor} tabular-nums`}>{score}</span>
    </div>
  );
}

export function StatCard({ title, value, change, icon: Icon, iconColor, trend }) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{title}</p>
      {change && <p className="text-xs text-slate-400 mt-1">{change}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">{description}</p>
    </div>
  );
}

export function SectionTitle({ children }) {
  return <h2 className="text-sm font-semibold text-slate-900 mb-3">{children}</h2>;
}