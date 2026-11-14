import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, User, Building2, Mail, Phone, RefreshCw } from 'lucide-react';
import { mockUsers, mockStartups } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import PageTransition from '../../layouts/PageTransition';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/helpers';

const PER_PAGE = 12;

export default function AdminUsers() {
  const { isApiSession } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [apiUsers, setApiUsers] = useState([]);
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
      setApiUsers([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');
    adminAPI.getUsers({ role: 'STARTUP', page, limit: PER_PAGE, ...(debouncedSearch ? { search: debouncedSearch } : {}) })
      .then((response) => {
        const result = response?.data?.data;
        if (!response?.data?.success || !Array.isArray(result?.items) || !result?.pagination) {
          throw new Error('The user service returned an invalid list.');
        }
        if (active) {
          setApiUsers(result.items);
          setPagination(result.pagination);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError?.apiMessage || getApiErrorMessage(requestError, 'Unable to load startup accounts.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [debouncedSearch, isApiSession, page, retryCount]);

  const demoUsers = useMemo(() => mockUsers.filter((user) => user.role === 'startup'), []);
  const filteredDemoUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return demoUsers.filter((user) => !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query));
  }, [demoUsers, search]);

  const users = isApiSession ? apiUsers : filteredDemoUsers;
  const total = isApiSession ? pagination.total : filteredDemoUsers.length;
  const totalPages = isApiSession ? Math.max(1, pagination.totalPages) : 1;
  const getStartup = (user) => isApiSession
    ? user.startup
    : mockStartups.find((startup) => startup.userId === user.id);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
            <p className="text-text-secondary text-sm mt-1">{total} registered startup accounts</p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" placeholder="Search users..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="input-field pl-10" />
        </div>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 flex items-center justify-between gap-3">
            <p role="alert" className="text-sm text-error">{error}</p>
            <button onClick={() => setRetryCount((count) => count + 1)} className="btn-ghost text-sm inline-flex items-center gap-2 shrink-0"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        )}

        {loading ? (
          <div role="status" className="card p-8 text-center text-sm text-text-secondary">Loading startup accounts…</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user, index) => {
              const startup = getStartup(user);
              return (
                <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text-primary truncate">{user.name}</p>
                      <p className="text-xs text-text-secondary">{isApiSession ? user.role.toLowerCase() : user.role}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary"><Mail className="w-3.5 h-3.5" /><span className="truncate">{user.email}</span></div>
                    {user.phone && <div className="flex items-center gap-2 text-text-secondary"><Phone className="w-3.5 h-3.5" /><span>{user.phone}</span></div>}
                    {startup && <div className="flex items-center gap-2 text-text-secondary"><Building2 className="w-3.5 h-3.5" /><span className="truncate">{startup.brandName || startup.legalName}</span></div>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-secondary">
                    <span>Joined {formatDate(user.createdAt)}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">{isApiSession ? 'Account record' : 'Demo account'}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary">No users match your search.</p>
          </div>
        )}

        {isApiSession && !loading && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </PageTransition>
  );
}
