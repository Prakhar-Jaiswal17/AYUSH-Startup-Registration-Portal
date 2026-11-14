import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Mail, Phone, MapPin, Briefcase, Plus, RefreshCw } from 'lucide-react';
import { useApplications } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import Modal from '../../components/common/Modal';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';

const EMPTY_ACCOUNT = { name: '', email: '', password: '', role: 'OFFICER', phone: '', designation: '', department: '', states: '' };
const ROLE_LABELS = { STARTUP: 'Startup User', OFFICER: 'Officer', ADMIN: 'Administrator' };

export default function AdminOfficers() {
  const { applications } = useApplications();
  const { isApiSession } = useAuth();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(isApiSession);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState(EMPTY_ACCOUNT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isApiSession) {
      setOfficers([]);
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError('');
    adminAPI.getOfficers({ page: 1, limit: 50 })
      .then((response) => {
        const items = response?.data?.data?.items;
        if (!response?.data?.success || !Array.isArray(items)) throw new Error('The officer service returned an invalid list.');
        if (active) setOfficers(items);
      })
      .catch((requestError) => { if (active) setError(requestError?.apiMessage || getApiErrorMessage(requestError, 'Unable to load officers.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isApiSession, retryCount]);

  const getOfficerStats = (officerId) => {
    const assigned = applications.filter((application) => application.assignedOfficer === officerId || application.assignedOfficer?.id === officerId);
    return {
      total: assigned.length,
      pending: assigned.filter((application) => ['Submitted', 'Under Review', 'Clarification Required', 'SUBMITTED', 'UNDER_REVIEW', 'QUERY_RAISED'].includes(application.status)).length,
      resolved: assigned.filter((application) => ['Approved', 'Rejected', 'APPROVED', 'REJECTED'].includes(application.status)).length,
    };
  };

  const closeModal = () => {
    if (saving) return;
    setShowAddModal(false);
    setNewAccount(EMPTY_ACCOUNT);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    setNotice('');
    try {
      const response = await adminAPI.createUser({
        name: newAccount.name.trim(),
        email: newAccount.email.trim(),
        password: newAccount.password,
        role: newAccount.role,
        phone: newAccount.phone.trim(),
        designation: newAccount.designation.trim(),
        department: newAccount.department.trim(),
        assignedStates: newAccount.states.split(',').map((state) => state.trim()).filter(Boolean),
      });
      const account = response?.data?.data;
      if (!response?.data?.success || !account?.id) throw new Error('The account service returned an invalid response.');
      if (account.role === 'OFFICER') setOfficers((current) => [...current, account].sort((left, right) => left.name.localeCompare(right.name)));
      setNotice(`${ROLE_LABELS[account.role] || 'User'} account created for ${account.email}. Share the initial password with them securely; no email was sent.`);
      setShowAddModal(false);
      setNewAccount(EMPTY_ACCOUNT);
    } catch (requestError) {
      setFormError(requestError?.apiMessage || getApiErrorMessage(requestError, 'Unable to create the account.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Officer Management</h1>
            <p className="text-text-secondary text-sm mt-1">{isApiSession ? `${officers.length} review officer${officers.length !== 1 ? 's' : ''}` : 'Sign in with a database-backed admin account to manage officers.'}</p>
          </div>
          <button onClick={() => { setError(''); setFormError(''); setNotice(''); setShowAddModal(true); }} disabled={!isApiSession} className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50"><Plus className="w-4 h-4" /> Add Account</button>
        </div>

        {error && <div role="alert" className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 flex items-center justify-between gap-3"><p className="text-sm text-error">{error}</p><button onClick={() => setRetryCount((count) => count + 1)} className="btn-ghost text-sm inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Retry</button></div>}
        {notice && <p role="status" className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">{notice}</p>}
        {!isApiSession && <p className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-text-secondary">Demo accounts cannot create real database users. Sign in with an administrator account from the database.</p>}

        {loading ? <div role="status" className="card p-8 text-center text-sm text-text-secondary">Loading officers…</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {officers.map((officer, index) => {
              const stats = getOfficerStats(officer.id);
              return (
                <motion.div key={officer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"><UserCheck className="w-6 h-6 text-primary" /></div>
                    <div className="min-w-0"><p className="font-semibold text-text-primary truncate">{officer.name}</p><p className="text-xs text-text-secondary">{officer.designation || 'Review Officer'}</p></div>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-text-secondary"><Mail className="w-3.5 h-3.5" /><span className="truncate">{officer.email}</span></div>
                    {officer.phone && <div className="flex items-center gap-2 text-text-secondary"><Phone className="w-3.5 h-3.5" />{officer.phone}</div>}
                    {officer.department && <div className="flex items-center gap-2 text-text-secondary"><Briefcase className="w-3.5 h-3.5" />{officer.department}</div>}
                    {officer.assignedStates?.length > 0 && <div className="flex items-center gap-2 text-text-secondary"><MapPin className="w-3.5 h-3.5" /><span>{officer.assignedStates.join(', ')}</span></div>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border-light">
                    <div className="text-center"><p className="text-lg font-bold text-text-primary">{stats.total}</p><p className="text-xs text-text-secondary">Assigned</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-warning">{stats.pending}</p><p className="text-xs text-text-secondary">Pending</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-success">{stats.resolved}</p><p className="text-xs text-text-secondary">Resolved</p></div>
                  </div>
                  {officer.createdAt && <p className="text-xs text-text-secondary mt-3">Joined {formatDate(officer.createdAt)}</p>}
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && isApiSession && officers.length === 0 && !error && <div className="card p-8 text-center text-sm text-text-secondary">No review officers found. Add an account with the Officer role to get started.</div>}

        <Modal isOpen={showAddModal} onClose={closeModal} title="Add Account">
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && <p role="alert" className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">{formError}</p>}
            <div><label className="label" htmlFor="account-role">Account role</label><select id="account-role" value={newAccount.role} onChange={(event) => setNewAccount((current) => ({ ...current, role: event.target.value }))} className="input-field"><option value="OFFICER">Review Officer</option><option value="ADMIN">Administrator</option><option value="STARTUP">Startup User</option></select></div>
            <div><label className="label" htmlFor="account-name">Full name</label><input id="account-name" required maxLength={255} value={newAccount.name} onChange={(event) => setNewAccount((current) => ({ ...current, name: event.target.value }))} className="input-field" autoComplete="name" /></div>
            <div><label className="label" htmlFor="account-email">Email</label><input id="account-email" required type="email" maxLength={255} value={newAccount.email} onChange={(event) => setNewAccount((current) => ({ ...current, email: event.target.value }))} className="input-field" autoComplete="email" /></div>
            <div><label className="label" htmlFor="account-password">Initial password</label><input id="account-password" required type="password" minLength={8} value={newAccount.password} onChange={(event) => setNewAccount((current) => ({ ...current, password: event.target.value }))} className="input-field" autoComplete="new-password" /><p className="text-xs text-text-secondary mt-1">At least 8 characters. The password is stored as a hash; share it securely. No email is sent.</p></div>
            <div><label className="label" htmlFor="account-phone">Phone (optional)</label><input id="account-phone" type="tel" maxLength={50} value={newAccount.phone} onChange={(event) => setNewAccount((current) => ({ ...current, phone: event.target.value }))} className="input-field" autoComplete="tel" /></div>
            {newAccount.role === 'OFFICER' && <>
              <div><label className="label" htmlFor="account-designation">Designation (optional)</label><input id="account-designation" maxLength={255} value={newAccount.designation} onChange={(event) => setNewAccount((current) => ({ ...current, designation: event.target.value }))} className="input-field" /></div>
              <div><label className="label" htmlFor="account-department">Department (optional)</label><input id="account-department" maxLength={255} value={newAccount.department} onChange={(event) => setNewAccount((current) => ({ ...current, department: event.target.value }))} className="input-field" /></div>
              <div><label className="label" htmlFor="account-states">Assigned states (optional)</label><input id="account-states" value={newAccount.states} onChange={(event) => setNewAccount((current) => ({ ...current, states: event.target.value }))} className="input-field" placeholder="Maharashtra, Gujarat" /><p className="text-xs text-text-secondary mt-1">Separate state names with commas.</p></div>
            </>}
            <div className="flex gap-3 justify-end pt-2"><button type="button" onClick={closeModal} disabled={saving} className="btn-ghost text-sm">Cancel</button><button type="submit" disabled={saving || !newAccount.name.trim() || !newAccount.email.trim() || newAccount.password.length < 8} className="btn-primary text-sm">{saving ? 'Creating…' : 'Create Account'}</button></div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}
