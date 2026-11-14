import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  ArrowRight,
  FileText,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Building2,
  Calendar,
  MapPin,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';

const statusOpts = [
  'All',
  'Submitted',
  'Under Review',
  'Clarification Required',
  'Resubmitted',
  'Approved',
  'Rejected',
];

const domainOpts = [
  'All',
  'Ayurveda',
  'Yoga & Naturopathy',
  'Unani',
  'Siddha',
  'Homoeopathy',
];

const PER_PAGE = 6;

export default function OfficerApplications() {
  const { user, isApiSession } = useAuth();
  const { applications, resetToMockData, applicationLoading, applicationError, refreshApplications } = useApplications();
  const isLiveOfficer = isApiSession && user?.role === 'officer';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [domainFilter, setDomainFilter] = useState('All');
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned'
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);

  // Safe base array
  const rawList = useMemo(() => (Array.isArray(applications) ? applications : []), [applications]);

  // Metrics counts
  const totalCount = rawList.length;
  const submittedCount = rawList.filter(a => a?.status === 'Submitted').length;
  const clarificationCount = rawList.filter(a => a?.status === 'Clarification Required').length;
  const myAssignedCount = rawList.filter(a => a?.assignedOfficer === user?.id).length;

  const filtered = useMemo(() => {
    let result = rawList.filter(a => {
      if (!a) return false;

      // Assignment scope filter
      if (assignmentFilter === 'assigned') {
        if (a.assignedOfficer !== user?.id) return false;
      } else if (assignmentFilter === 'unassigned') {
        if (a.assignedOfficer) return false;
      }

      // Status filter
      if (statusFilter !== 'All' && a.status !== statusFilter) {
        return false;
      }

      // Domain filter
      if (domainFilter !== 'All' && a.ayushDomain !== domainFilter) {
        return false;
      }

      // Search term
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const idMatch = (a.id || '').toLowerCase().includes(q);
        const nameMatch = (a.startupName || a.brandName || '').toLowerCase().includes(q);
        const stateMatch = (a.state || '').toLowerCase().includes(q);
        const domainMatch = (a.ayushDomain || '').toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !stateMatch && !domainMatch) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      const timeA = new Date(a?.lastUpdated || a?.submittedAt || 0).getTime();
      const timeB = new Date(b?.lastUpdated || b?.submittedAt || 0).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [rawList, search, statusFilter, domainFilter, assignmentFilter, sortOrder, user]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDomainFilter('All');
    setAssignmentFilter('all');
    setSortOrder('newest');
    setPage(1);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Application Review Queue</h1>
            <p className="text-text-secondary text-sm mt-0.5">
              {isApiSession ? 'Review applications assigned to you and manage clarification requests. Document verification is not connected yet.' : 'Review, verify documentation, and process startup facilitation registrations.'}
            </p>
          </div>
          {!isApiSession && rawList.length === 0 && (
            <button
              onClick={resetToMockData}
              className="btn-secondary text-xs inline-flex items-center gap-1.5 self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reload Demo Applications
            </button>
          )}
        </div>

        {applicationError && isApiSession && (
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="alert">
            <p className="text-sm text-error">{applicationError}</p>
            <button onClick={() => refreshApplications().catch(() => {})} className="btn-secondary inline-flex items-center gap-2 text-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        )}

        {/* Metric Quick-Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => { setAssignmentFilter('all'); setStatusFilter('All'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              assignmentFilter === 'all' && statusFilter === 'All'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border-light bg-surface hover:border-gray-300'
            }`}
          >
            <p className="text-xs text-text-secondary font-medium">All Applications</p>
            <p className="text-xl font-bold text-text-primary mt-1">{totalCount}</p>
          </button>

          <button
            onClick={() => { setAssignmentFilter('assigned'); setStatusFilter('All'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              assignmentFilter === 'assigned'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border-light bg-surface hover:border-gray-300'
            }`}
          >
            <p className="text-xs text-text-secondary font-medium">Assigned to Me</p>
            <p className="text-xl font-bold text-primary mt-1">{myAssignedCount}</p>
          </button>

          <button
            onClick={() => { setAssignmentFilter('all'); setStatusFilter('Submitted'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              statusFilter === 'Submitted'
                ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20'
                : 'border-border-light bg-surface hover:border-gray-300'
            }`}
          >
            <p className="text-xs text-text-secondary font-medium">New Submissions</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{submittedCount}</p>
          </button>

          <button
            onClick={() => { setAssignmentFilter('all'); setStatusFilter('Clarification Required'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              statusFilter === 'Clarification Required'
                ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500/20'
                : 'border-border-light bg-surface hover:border-gray-300'
            }`}
          >
            <p className="text-xs text-text-secondary font-medium">Clarifications</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{clarificationCount}</p>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="card p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search by ID, startup name, domain, or state..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="input-field pl-9 text-sm"
              />
            </div>

            {!isLiveOfficer && (
              <select
                value={assignmentFilter}
                onChange={e => {
                  setAssignmentFilter(e.target.value);
                  setPage(1);
                }}
                className="input-field w-auto text-sm"
              >
                <option value="all">Queue: All Applications</option>
                <option value="assigned">Queue: Assigned to Me</option>
                <option value="unassigned">Queue: Unassigned</option>
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input-field w-auto text-sm"
            >
              {statusOpts.map(s => (
                <option key={s} value={s}>
                  {s === 'All' ? 'Status: All' : `Status: ${s}`}
                </option>
              ))}
            </select>

            {/* Domain Filter */}
            <select
              value={domainFilter}
              onChange={e => {
                setDomainFilter(e.target.value);
                setPage(1);
              }}
              className="input-field w-auto text-sm"
            >
              {domainOpts.map(d => (
                <option key={d} value={d}>
                  {d === 'All' ? 'Domain: All' : d}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="input-field w-auto text-sm"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>

          {(search || statusFilter !== 'All' || domainFilter !== 'All' || assignmentFilter !== 'all') && (
            <div className="flex items-center justify-between pt-2 border-t border-border-light text-xs text-text-secondary">
              <span>Showing {filtered.length} of {totalCount} applications</span>
              <button
                onClick={resetFilters}
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Applications List */}
        {applicationLoading && isApiSession ? (
          <div role="status" className="card p-8 text-center text-sm text-text-secondary">Loading the review queue…</div>
        ) : paginated.length > 0 ? (
          <div className="space-y-3">
            {paginated.map((app, i) => (
              <motion.div
                key={app?.id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/officer/applications/${app?.id}`}
                  className="card-hover block p-5 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-base text-text-primary tracking-tight">
                          {app?.id}
                        </span>
                        <StatusBadge status={app?.status || 'Draft'} size="sm" />
                        {app?.assignedOfficer === user?.id && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                            Assigned to you
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <span>{app?.startupName || app?.brandName || 'Unnamed Startup'}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap pt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[#E99B35]" />
                          {app?.ayushDomain || 'General'}
                        </span>
                        {app?.state && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {app.state}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {app?.submittedAt ? `Submitted ${formatDate(app.submittedAt)}` : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-sm font-semibold text-primary group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        Review Application <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
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
              search || statusFilter !== 'All' || domainFilter !== 'All'
                ? 'No applications match your active filters. Try broadening your criteria or reset the filters.'
                : 'There are currently no startup applications in the queue.'
            }
            action={
              (search || statusFilter !== 'All' || domainFilter !== 'All' || assignmentFilter !== 'all') ? (
                <button onClick={resetFilters} className="btn-secondary text-sm">
                  Reset All Filters
                </button>
              ) : !isApiSession ? (
                <button onClick={resetToMockData} className="btn-primary text-sm inline-flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Load Demo Applications
                </button>
              ) : null
            }
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </PageTransition>
  );
}
