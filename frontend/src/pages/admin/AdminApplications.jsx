import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FileText, RotateCcw, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import { officerAPI, getApiErrorMessage } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';

const statusOpts = ['All', 'Draft', 'Submitted', 'Under Review', 'Clarification Required', 'Resubmitted', 'Approved', 'Rejected'];
const domainOpts = ['All', 'Ayurveda', 'Yoga & Naturopathy', 'Unani', 'Siddha', 'Homoeopathy'];
const PER_PAGE = 8;

export default function AdminApplications() {
  const { user, isApiSession } = useAuth();
  const { applications, resetToMockData, applicationLoading, applicationError, refreshApplications, assignApplication } = useApplications();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [domainFilter, setDomainFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [officers, setOfficers] = useState([]);
  const [officersLoading, setOfficersLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [assigningApplicationId, setAssigningApplicationId] = useState('');

  useEffect(() => {
    if (!isApiSession || user?.role !== 'admin') return undefined;
    let active = true;
    setOfficersLoading(true);
    officerAPI.getOfficers()
      .then((response) => {
        const body = response?.data;
        if (!body?.success || !Array.isArray(body.data)) throw new Error(body?.error || 'The officer list was not returned by the server.');
        if (active) setOfficers(body.data);
      })
      .catch((error) => {
        if (active) setAssignmentError(error?.apiMessage || getApiErrorMessage(error, 'Unable to load review officers.'));
      })
      .finally(() => { if (active) setOfficersLoading(false); });
    return () => { active = false; };
  }, [isApiSession, user?.role]);

  const handleAssignment = async (applicationId, officerId) => {
    if (!officerId) return;
    setAssigningApplicationId(applicationId);
    setAssignmentError('');
    try {
      await assignApplication(applicationId, officerId);
    } catch (error) {
      setAssignmentError(error?.apiMessage || getApiErrorMessage(error, 'Unable to assign this application.'));
      await refreshApplications().catch(() => {});
    } finally {
      setAssigningApplicationId('');
    }
  };

  const retryQueue = async () => {
    setAssignmentError('');
    await refreshApplications().catch(() => {});
    if (!isApiSession || user?.role !== 'admin' || officers.length > 0) return;
    setOfficersLoading(true);
    try {
      const response = await officerAPI.getOfficers();
      const body = response?.data;
      if (!body?.success || !Array.isArray(body.data)) throw new Error(body?.error || 'The officer list was not returned by the server.');
      setOfficers(body.data);
    } catch (error) {
      setAssignmentError(error?.apiMessage || getApiErrorMessage(error, 'Unable to load review officers.'));
    } finally {
      setOfficersLoading(false);
    }
  };

  const rawList = useMemo(() => (Array.isArray(applications) ? applications : []), [applications]);
  const reviewLinkBase = user?.role === 'admin' ? '/admin/applications' : '/officer/applications';
  const visibleStatuses = isApiSession ? statusOpts.filter((status) => status !== 'Draft') : statusOpts;

  const filtered = useMemo(() => {
    return rawList.filter(a => {
      if (!a) return false;
      const q = search.toLowerCase().trim();
      const ms =
        !q ||
        (a.id || '').toLowerCase().includes(q) ||
        (a.startupName || a.brandName || '').toLowerCase().includes(q) ||
        (a.state || '').toLowerCase().includes(q);
      const mst = statusFilter === 'All' || a.status === statusFilter;
      const md = domainFilter === 'All' || a.ayushDomain === domainFilter;
      return ms && mst && md;
    }).sort((a, b) => {
      const timeA = new Date(a?.lastUpdated || a?.submittedAt || 0).getTime();
      const timeB = new Date(b?.lastUpdated || b?.submittedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [rawList, search, statusFilter, domainFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Application Management</h1>
            <p className="text-text-secondary text-sm mt-1">{rawList.length} {isApiSession ? 'non-draft applications in the review queue' : 'total applications across all AYUSH domains'}</p>
          </div>
          {!isApiSession && rawList.length === 0 && (
            <button
              onClick={resetToMockData}
              className="btn-secondary text-xs inline-flex items-center gap-1.5 self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reload Demo Data
            </button>
          )}
        </div>

        {(applicationError || assignmentError) && (
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="alert">
            <p className="text-sm text-error">{assignmentError || applicationError}</p>
            <button onClick={retryQueue} className="btn-secondary inline-flex items-center gap-2 text-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by ID, startup, or state..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10 text-sm"
            />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto text-sm">
            {visibleStatuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <select value={domainFilter} onChange={e => { setDomainFilter(e.target.value); setPage(1); }} className="input-field w-auto text-sm">
            {domainOpts.map(d => <option key={d} value={d}>{d === 'All' ? 'All Domains' : d}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border-light">
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">App ID</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">Startup</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary hidden md:table-cell">Domain</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary hidden sm:table-cell">State</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">Status</th>
                  {isApiSession && <th className="text-left py-3 px-4 font-medium text-text-secondary">Assigned Officer</th>}
                  <th className="text-left py-3 px-4 font-medium text-text-secondary hidden lg:table-cell">Updated</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {applicationLoading && isApiSession ? (
                  <tr><td colSpan={8} className="py-10 text-center text-text-secondary">Loading review queue…</td></tr>
                ) : paginated.map((app, i) => (
                  <motion.tr key={app?.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border-light last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{app?.id}</td>
                    <td className="py-3 px-4">{app?.startupName || app?.brandName || '—'}</td>
                    <td className="py-3 px-4 hidden md:table-cell"><span className="text-xs px-2 py-0.5 bg-primary/5 text-primary rounded">{app?.ayushDomain}</span></td>
                    <td className="py-3 px-4 hidden sm:table-cell text-text-secondary">{app?.state || '—'}</td>
                    <td className="py-3 px-4"><StatusBadge status={app?.status || 'Draft'} size="sm" /></td>
                    {isApiSession && <td className="py-3 px-4">
                      <select
                        value={app?.assignedOfficer || ''}
                        onChange={(event) => handleAssignment(app.id, event.target.value)}
                        disabled={['Approved', 'Rejected'].includes(app?.status) || officersLoading || assigningApplicationId === app.id || officers.length === 0}
                        className="input-field min-w-[170px] py-1.5 text-xs disabled:opacity-60"
                        aria-label={`Assign ${app.id} to an officer`}
                      >
                        <option value="" disabled>{officersLoading ? 'Loading officers…' : officers.length === 0 ? 'No officers available' : 'Unassigned'}</option>
                        {officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.name}</option>)}
                      </select>
                    </td>}
                    <td className="py-3 px-4 text-text-secondary hidden lg:table-cell">{formatDate(app?.lastUpdated)}</td>
                    <td className="py-3 px-4 text-right"><Link to={`${reviewLinkBase}/${app?.id}`} className="text-primary text-xs font-medium hover:underline">View Review</Link></td>
                  </motion.tr>
                ))}
                {!applicationLoading && paginated.length === 0 && (
                  <tr><td colSpan={isApiSession ? 8 : 7} className="py-12 text-center"><EmptyState icon={FileText} title="No Applications Found" description={isApiSession ? 'Try adjusting your filters or wait for an application to enter the review queue.' : 'Try adjusting your filters or reload demo data.'} /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && !applicationLoading && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </PageTransition>
  );
}
