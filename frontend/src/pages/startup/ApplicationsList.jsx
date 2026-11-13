import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FileText, ArrowRight, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';

const statusOptions = ['All', 'Draft', 'Submitted', 'Under Review', 'Clarification Required', 'Approved', 'Rejected'];

export default function ApplicationsList() {
  const { startup, isApiSession } = useAuth();
  const { applications, getApplicationsByStartup, applicationLoading, applicationError, refreshApplications } = useApplications();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const myApps = useMemo(() => {
    if (isApiSession) return applications || [];
    if (startup?.id) {
      const matched = getApplicationsByStartup(startup.id);
      if (matched.length > 0) return matched;
    }
    return (applications || []).filter(a => a?.startupId === (startup?.id || 'stp_001'));
  }, [isApiSession, startup, getApplicationsByStartup, applications]);

  const filtered = useMemo(() => {
    return myApps.filter(app => {
      if (!app) return false;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (app.id || '').toLowerCase().includes(q) ||
        (app.ayushDomain || '').toLowerCase().includes(q) ||
        (app.startupName || app.brandName || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || app.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [myApps, search, statusFilter]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Applications</h1>
            <p className="text-text-secondary text-sm mt-1">{myApps.length} application{myApps.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/dashboard/applications/new" className="btn-primary inline-flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> New Application
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by ID or domain..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field w-auto min-w-[160px] text-sm"
          >
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {applicationError && isApiSession && (
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="alert">
            <p className="text-sm text-error">{applicationError}</p>
            <button onClick={() => refreshApplications().catch(() => {})} className="btn-secondary inline-flex items-center gap-2 text-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        )}

        {/* Applications */}
        {applicationLoading && isApiSession ? (
          <div role="status" className="card p-8 text-center text-sm text-text-secondary">Loading your applications…</div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((app, i) => (
              <motion.div key={app?.id || i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/dashboard/applications/${app?.id}`} className="card-hover block p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-text-primary">{app?.id}</p>
                      <p className="text-sm text-text-secondary mt-0.5">{app?.startupName || app?.brandName}</p>
                    </div>
                    <StatusBadge status={app?.status || 'Draft'} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span className="px-2 py-0.5 bg-primary/5 text-primary rounded-md font-medium">{app?.ayushDomain}</span>
                    <span>{app?.submittedAt ? `Submitted ${formatDate(app.submittedAt)}` : 'Draft'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-primary font-medium mt-3">
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No Applications Found"
            description={
              search || statusFilter !== 'All'
                ? 'Try adjusting your filters.'
                : 'Start your first application to begin the registration process.'
            }
            action={
              !search && statusFilter === 'All' ? (
                <Link to="/dashboard/applications/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Application
                </Link>
              ) : (
                <button onClick={() => { setSearch(''); setStatusFilter('All'); }} className="btn-secondary text-sm">
                  Clear Filters
                </button>
              )
            }
          />
        )}
      </div>
    </PageTransition>
  );
}
