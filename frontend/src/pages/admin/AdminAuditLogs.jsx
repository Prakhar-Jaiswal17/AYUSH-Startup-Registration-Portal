import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, Download, Clock } from 'lucide-react';
import { mockAuditLogs } from '../../data/mockData';
import PageTransition from '../../layouts/PageTransition';
import { formatDateTime } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';

const roles = ['All', 'Startup', 'Officer', 'Admin', 'System'];
const PER_PAGE = 8;

export default function AdminAuditLogs() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockAuditLogs.filter(log => {
      const matchSearch =
        !search ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.target.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'All' || log.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportLogs = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Timestamp,User,Role,Action,Target,Details']
        .concat(
          filtered.map(l =>
            `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.target}","${l.details}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ayush_setu_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">System Audit Logs</h1>
            <p className="text-text-secondary text-sm mt-1">
              Immutable ledger of platform activities, status changes, and user actions.
            </p>
          </div>
          <button
            onClick={exportLogs}
            className="btn-secondary inline-flex items-center gap-2 self-start text-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by action, user, or target..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="input-field w-auto"
          >
            {roles.map(r => (
              <option key={r} value={r}>
                {r === 'All' ? 'All Roles' : `${r} Actions`}
              </option>
            ))}
          </select>
        </div>

        {/* Audit Table */}
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
                {paginated.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border-light last:border-0 hover:bg-gray-50/70"
                  >
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap text-xs">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.role === 'Admin'
                            ? 'bg-amber-100 text-amber-800'
                            : log.role === 'Officer'
                              ? 'bg-blue-100 text-blue-800'
                              : log.role === 'Startup'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-text-secondary whitespace-nowrap">
                      {log.target}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{log.details}</td>
                  </motion.tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary">
                      <Clock className="w-8 h-8 text-text-secondary/40 mx-auto mb-2" />
                      No audit logs match the current search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>
    </PageTransition>
  );
}

