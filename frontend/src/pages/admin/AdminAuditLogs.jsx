import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Clock, RefreshCw } from 'lucide-react';
import { mockAuditLogs } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import PageTransition from '../../layouts/PageTransition';
import { formatDateTime } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';

const roles = ['All', 'Startup', 'Officer', 'Admin', 'System'];
const PER_PAGE = 8;

function csvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function AdminAuditLogs() {
  const { isApiSession } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [apiLogs, setApiLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(isApiSession);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isApiSession) {
      setApiLogs([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');
    adminAPI.getAuditLogs({
      page,
      limit: PER_PAGE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(roleFilter !== 'All' ? { actorRole: roleFilter.toUpperCase() } : {}),
    })
      .then((response) => {
        const result = response?.data?.data;
        if (!response?.data?.success || !Array.isArray(result?.items) || !result?.pagination) {
          throw new Error('The audit-log service returned an invalid list.');
        }
        if (active) {
          setApiLogs(result.items.map((log) => ({
            id: log.id,
            timestamp: log.createdAt,
            user: log.actorName,
            role: log.actorRole ? `${log.actorRole[0]}${log.actorRole.slice(1).toLowerCase()}` : 'System',
            action: log.action,
            target: `${log.targetEntity}: ${log.targetId}`,
            details: log.details,
          })));
          setPagination(result.pagination);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError?.apiMessage || getApiErrorMessage(requestError, 'Unable to load audit logs.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [debouncedSearch, isApiSession, page, retryCount, roleFilter]);

  const filteredDemoLogs = useMemo(() => mockAuditLogs.filter((log) => {
    const query = search.trim().toLowerCase();
    const matchSearch = !query || [log.action, log.user, log.target, log.details].some((value) => String(value || '').toLowerCase().includes(query));
    const matchRole = roleFilter === 'All' || log.role === roleFilter;
    return matchSearch && matchRole;
  }), [roleFilter, search]);

  const visibleLogs = isApiSession ? apiLogs : filteredDemoLogs.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = isApiSession ? Math.max(1, pagination.totalPages) : Math.max(1, Math.ceil(filteredDemoLogs.length / PER_PAGE));

  const exportLogs = () => {
    const exportRows = isApiSession ? visibleLogs : filteredDemoLogs;
    const rows = [
      ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Target', 'Details'].map(csvValue).join(','),
      ...exportRows.map((log) => [log.id, log.timestamp, log.user, log.role, log.action, log.target, log.details].map(csvValue).join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ayush_setu_audit_logs_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">System Audit Logs</h1>
            <p className="text-text-secondary text-sm mt-1">Immutable ledger of platform activities, status changes, and user actions.</p>
          </div>
          <button onClick={exportLogs} disabled={loading || visibleLogs.length === 0} className="btn-secondary inline-flex items-center gap-2 self-start text-sm disabled:opacity-50">
            <Download className="w-4 h-4" /> {isApiSession ? 'Export Current Page' : 'Export CSV'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input type="text" placeholder="Search by action, user, or target..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="input-field pl-10" />
          </div>
          <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }} className="input-field w-auto">
            {roles.map((role) => <option key={role} value={role}>{role === 'All' ? 'All Roles' : `${role} Actions`}</option>)}
          </select>
        </div>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 flex items-center justify-between gap-3">
            <p role="alert" className="text-sm text-error">{error}</p>
            <button onClick={() => setRetryCount((count) => count + 1)} className="btn-ghost text-sm inline-flex items-center gap-2 shrink-0"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border-light text-text-secondary">
                  <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium">Actor</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Action</th>
                  <th className="text-left py-3 px-4 font-medium">Target</th>
                  <th className="text-left py-3 px-4 font-medium">Event Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} role="status" className="py-12 text-center text-text-secondary">Loading audit logs…</td></tr>
                ) : visibleLogs.map((log, index) => (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="border-b border-border-light last:border-0 hover:bg-gray-50/70">
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap text-xs">{formatDateTime(log.timestamp)}</td>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">{log.user}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.role === 'Admin' ? 'bg-amber-100 text-amber-800' : log.role === 'Officer' ? 'bg-blue-100 text-blue-800' : log.role === 'Startup' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>{log.role}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-xs text-text-secondary whitespace-nowrap">{log.target}</td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{log.details}</td>
                  </motion.tr>
                ))}
                {!loading && visibleLogs.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-text-secondary"><Clock className="w-8 h-8 text-text-secondary/40 mx-auto mb-2" />No audit logs match the current search filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </PageTransition>
  );
}
