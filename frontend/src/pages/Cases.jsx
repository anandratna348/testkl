import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ArrowUpDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Badge, HealthBar, PageHeader } from '../components/ui/index.jsx';
import { getCases } from '../services/api.js';

const STATUSES = ['All', 'Active', 'Review', 'High Risk', 'Pending', 'Completed'];
const priorityColor = {
  Urgent: 'text-red-600 bg-red-50',
  High: 'text-amber-600 bg-amber-50',
  Medium: 'text-brand-600 bg-brand-50',
  Low: 'text-slate-500 bg-slate-100',
};

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sortField, setSortField] = useState('id');

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCases();
      // Backend returns array of tuples: [id, client_name, case_type, priority, status, health_score]
      const mapped = data.map(row => ({
        id: row[0],
        client: row[1],
        type: row[2],
        priority: row[3],
        status: row[4] || 'Active',
        health: row[5] || 0,
        deadline: row[6] || '—',
        lastUpdated: row[7] || '—',
        assignee: row[8] || '—',
      }));
      setCases(mapped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, []);

  const filtered = cases.filter(c => {
    const matchSearch =
      String(c.id).toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === 'All' || c.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <div className="fade-in">
      <PageHeader title="Cases" subtitle={`${filtered.length} cases found`}>
        <button onClick={fetchCases} className="btn-secondary">
          <RefreshCw size={15} />
        </button>
        <Link to="/create-case" className="btn-primary">
          <Plus size={16} />
          New Case
        </Link>
      </PageHeader>

      <div className="card">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by case ID, client, or type..."
              className="input pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  status === s ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="text-center py-16 text-slate-400 text-sm">Loading cases...</div>
        )}
        {error && (
          <div className="text-center py-16 text-red-500 text-sm">Error: {error}</div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {[
                    { label: 'Case ID', field: 'id' },
                    { label: 'Client Name', field: 'client' },
                    { label: 'Case Type', field: 'type' },
                    { label: 'Priority', field: 'priority' },
                    { label: 'Status', field: 'status' },
                    { label: 'Health Score', field: 'health' },
                    { label: 'Deadline', field: 'deadline' },
                    { label: 'Last Updated', field: 'lastUpdated' },
                    { label: '', field: null },
                  ].map(({ label, field }) => (
                    <th key={label} className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {field ? (
                        <button
                          onClick={() => setSortField(field)}
                          className={`flex items-center gap-1 hover:text-slate-700 transition-colors ${sortField === field ? 'text-slate-700' : ''}`}
                        >
                          {label}
                          <ArrowUpDown size={11} />
                        </button>
                      ) : label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono font-semibold text-brand-600">#{c.id}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{c.client}</p>
                        <p className="text-xs text-slate-400">{c.assignee}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">{c.type}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${priorityColor[c.priority] || 'text-slate-500 bg-slate-100'}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><Badge status={c.status} /></td>
                    <td className="px-4 py-3.5 min-w-[120px]"><HealthBar score={c.health} /></td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{c.deadline}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{c.lastUpdated}</td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/cases/${c.id}`}
                        className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-xs text-brand-600 font-medium transition-opacity"
                      >
                        View <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <p className="text-sm font-medium">No cases found</p>
                <p className="text-xs mt-1">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">Showing {filtered.length} of {cases.length} cases</p>
        </div>
      </div>
    </div>
  );
}