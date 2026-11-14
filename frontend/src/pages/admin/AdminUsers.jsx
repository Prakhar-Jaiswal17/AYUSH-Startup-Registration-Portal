import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, User, Building2, Mail, Phone, RefreshCw, Trash2, Save, Filter, RotateCcw } from 'lucide-react';
import { mockUsers, mockStartups } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import PageTransition from '../../layouts/PageTransition';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/helpers';

const PER_PAGE = 12;
const ROLE_LABELS = { STARTUP: 'Startup User', OFFICER: 'Review Officer', ADMIN: 'Administrator' };

export default function AdminUsers() {
  const { isApiSession, user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [apiUsers, setApiUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(isApiSession);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [savingUserId, setSavingUserId] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');

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
    adminAPI.getUsers({ page, limit: PER_PAGE, ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}), ...(debouncedSearch ? { search: debouncedSearch } : {}) })
      .then((response) => {
        const result = response?.data?.data;
        if (!response?.data?.success || !Array.isArray(result?.items) || !result?.pagination) throw new Error('The user service returned an invalid list.');
        if (active) {
          setApiUsers(result.items);
          setPagination(result.pagination);
          setRoleDrafts({});
        }
      })
      .catch((requestError) => { if (active) setError(requestError?.apiMessage || getApiErrorMessage(requestError, 'Unable to load accounts.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedSearch, isApiSession, page, retryCount, roleFilter]);

  const demoUsers = useMemo(() => mockUsers, []);
  const filteredDemoUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return demoUsers.filter((account) => {
      const matchesRole = roleFilter === 'ALL' || account.role.toUpperCase() === roleFilter;
      const matchesSearch = !query || account.name.toLowerCase().includes(query) || account.email.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [demoUsers, roleFilter, search]);
  const users = isApiSession ? apiUsers : filteredDemoUsers;
  const total = isApiSession ? pagination.total : filteredDemoUsers.length;
  const totalPages = isApiSession ? Math.max(1, pagination.totalPages) : 1;
  const getStartup = (account) => isApiSession ? account.startup : mockStartups.find((startup) => startup.userId === account.id);

  const saveRole = async (account) => {
    const role = roleDrafts[account.id];
    if (!role || role === account.role) return;
    setSavingUserId(account.id);
    setError('');
    setNotice('');
    try {
      const response = await adminAPI.updateUser(account.id, { role });
      const updated = response?.data?.data;
      if (!response?.data?.success || !updated?.id) throw new Error('The account service returned an invalid response.');
      setApiUsers((current) => current.map((existing) => existing.id === updated.id ? { ...existing, ...updated } : existing));
      setRoleDrafts((current) => { const next = { ...current }; delete next[account.id]; return next; });
      setNotice(`${account.name}'s role was changed to ${ROLE_LABELS[updated.role] || updated.role}.`);
    } catch (requestError) {
      setError(requestError?.apiMessage || getApiErrorMessage(requestError, 'Unable to update the account role.'));
    } finally {
      setSavingUserId('');
    }
  };

  const deleteAccount = async (account) => {
    const linkedDataWarning = account.startup
      ? '\n\nThis account has a startup profile. Deleting it also permanently deletes its startup profile, applications, and related documents/notifications.'
      : '\n\nRelated notifications and clarification records may also be permanently deleted; application assignments and audit references are retained without this account.';
    if (!window.confirm(`Permanently delete ${account.name} (${account.email})?${linkedDataWarning}\n\nThis cannot be undone.`)) return;

    setDeletingUserId(account.id);
    setError('');
    setNotice('');
    try {
      const response = await adminAPI.deleteUser(account.id);
      if (!response?.data?.success) throw new Error('The account service did not confirm deletion.');
      setApiUsers((current) => current.filter((existing) => existing.id !== account.id));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      setNotice(`${account.name}'s account was deleted.`);
      if (apiUsers.length === 1 && page > 1) setPage((current) => current - 1);
    } catch (requestError) {
      setError(requestError?.apiMessage || getApiErrorMessage(requestError, 'Unable to delete the account.'));
    } finally {
      setDeletingUserId('');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-text-secondary text-sm mt-1">{isApiSession ? `${total} account${total !== 1 ? 's' : ''} across all roles` : `${total} demo startup account${total !== 1 ? 's' : ''}`}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="relative w-full max-w-sm"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" /><input type="search" placeholder="Search accounts..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="input-field pl-10" /></div>
          <div className="relative">
            <button type="button" onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen} aria-controls="user-role-filter" className={`btn-secondary inline-flex items-center gap-2 text-sm ${roleFilter !== 'ALL' ? 'border-primary text-primary' : ''}`}>
              <Filter className="w-4 h-4" />{roleFilter === 'ALL' ? 'Filter by role' : ROLE_LABELS[roleFilter]}<span aria-hidden="true">▾</span>
            </button>
            {filterOpen && <div id="user-role-filter" className="absolute z-20 mt-2 w-64 rounded-xl border border-border-light bg-white p-4 shadow-lg">
              <label htmlFor="user-role-select" className="label">Show accounts with role</label>
              <select id="user-role-select" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }} className="input-field text-sm">
                <option value="ALL">All roles</option><option value="STARTUP">Startup User</option><option value="OFFICER">Review Officer</option><option value="ADMIN">Administrator</option>
              </select>
              {roleFilter !== 'ALL' && <button type="button" onClick={() => { setRoleFilter('ALL'); setPage(1); }} className="mt-3 text-sm text-primary inline-flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Clear role filter</button>}
            </div>}
          </div>
        </div>

        {!isApiSession && <p className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-text-secondary">Demo accounts are sample data. Sign in with a database-backed administrator account to change roles or delete real accounts.</p>}
        {error && <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 flex items-center justify-between gap-3"><p role="alert" className="text-sm text-error">{error}</p><button onClick={() => setRetryCount((count) => count + 1)} className="btn-ghost text-sm inline-flex items-center gap-2 shrink-0"><RefreshCw className="w-4 h-4" /> Retry</button></div>}
        {notice && <p role="status" className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">{notice}</p>}

        {loading ? <div role="status" className="card p-8 text-center text-sm text-text-secondary">Loading accounts…</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((account, index) => {
              const startup = getStartup(account);
              const selectedRole = roleDrafts[account.id] ?? account.role;
              const isSelf = account.id === currentUser?.id;
              return (
                <motion.div key={account.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                    <div className="min-w-0"><p className="font-semibold text-sm text-text-primary truncate">{account.name}</p><p className="text-xs text-text-secondary">{ROLE_LABELS[account.role] || account.role}</p></div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary"><Mail className="w-3.5 h-3.5" /><span className="truncate">{account.email}</span></div>
                    {account.phone && <div className="flex items-center gap-2 text-text-secondary"><Phone className="w-3.5 h-3.5" /><span>{account.phone}</span></div>}
                    {startup && <div className="flex items-center gap-2 text-text-secondary"><Building2 className="w-3.5 h-3.5" /><span className="truncate">{startup.brandName || startup.legalName}</span></div>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border-light"><p className="text-xs text-text-secondary mb-3">Joined {formatDate(account.createdAt)}</p>
                    {isApiSession && <>
                      <label className="label" htmlFor={`role-${account.id}`}>Account role</label>
                      <select id={`role-${account.id}`} value={selectedRole} disabled={isSelf || savingUserId === account.id || deletingUserId === account.id} onChange={(event) => setRoleDrafts((current) => ({ ...current, [account.id]: event.target.value }))} className="input-field text-sm">
                        <option value="STARTUP">Startup User</option><option value="OFFICER">Review Officer</option><option value="ADMIN">Administrator</option>
                      </select>
                      {isSelf && <p className="text-xs text-text-secondary mt-1">You cannot change your own role or delete this account.</p>}
                      <div className="flex items-center justify-between gap-2 mt-3">
                        <button onClick={() => deleteAccount(account)} disabled={isSelf || savingUserId === account.id || deletingUserId === account.id} className="btn-ghost text-sm inline-flex items-center gap-1 text-error disabled:opacity-50"><Trash2 className="w-4 h-4" />{deletingUserId === account.id ? 'Deleting…' : 'Delete'}</button>
                        <button onClick={() => saveRole(account)} disabled={isSelf || selectedRole === account.role || savingUserId === account.id || deletingUserId === account.id} className="btn-primary text-sm inline-flex items-center gap-1 disabled:opacity-50"><Save className="w-4 h-4" />{savingUserId === account.id ? 'Saving…' : 'Save role'}</button>
                      </div>
                    </>}
                    {!isApiSession && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium text-xs">Demo account</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && users.length === 0 && <div className="text-center py-12"><Users className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" /><p className="text-text-secondary">No accounts match your search.</p></div>}
        {isApiSession && !loading && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </PageTransition>
  );
}
