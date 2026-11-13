import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, Eye, MessageSquare, CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';

export default function OfficerDashboard() {
  const { user, isApiSession } = useAuth();
  const { applications, applicationLoading, applicationError, refreshApplications } = useApplications();

  const assigned = isApiSession
    ? applications
    : applications.filter(a => a.assignedOfficer === user?.id || (!a.assignedOfficer && a.status !== 'Draft'));
  const byStatus = (s) => assigned.filter(a => a.status === s).length;
  const recent = [...assigned].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)).slice(0, 5);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-text-primary">Welcome, {user?.name}</motion.h1>
          <p className="text-text-secondary text-sm mt-1">{user?.designation} &middot; {user?.department}</p>
        </div>

        {applicationError && isApiSession && (
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="alert">
            <p className="text-sm text-error">{applicationError}</p>
            <button onClick={() => refreshApplications().catch(() => {})} className="btn-secondary inline-flex items-center gap-2 text-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Briefcase} value={assigned.length} label="Total Assigned" />
          <StatCard icon={Clock} value={byStatus('Submitted') + byStatus('Resubmitted')} label="Pending Review" />
          <StatCard icon={Eye} value={byStatus('Under Review')} label="Under Review" />
          <StatCard icon={MessageSquare} value={byStatus('Clarification Required')} label="Clarification" />
          <StatCard icon={CheckCircle2} value={byStatus('Approved')} label="Approved" />
          <StatCard icon={XCircle} value={byStatus('Rejected')} label="Rejected" />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary">Recent Applications</h2>
            <Link to="/officer/applications" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">View All <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left py-2.5 px-3 font-medium text-text-secondary">Application ID</th>
                  <th className="text-left py-2.5 px-3 font-medium text-text-secondary">Startup</th>
                  <th className="text-left py-2.5 px-3 font-medium text-text-secondary hidden md:table-cell">Domain</th>
                  <th className="text-left py-2.5 px-3 font-medium text-text-secondary">Status</th>
                  <th className="text-left py-2.5 px-3 font-medium text-text-secondary hidden sm:table-cell">Date</th>
                  <th className="text-right py-2.5 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {applicationLoading && isApiSession ? (
                  <tr><td colSpan={6} className="py-8 text-center text-text-secondary">Loading assigned applications…</td></tr>
                ) : recent.map((app, i) => (
                  <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border-light last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">{app.id}</td>
                    <td className="py-3 px-3">{app.startupName}</td>
                    <td className="py-3 px-3 hidden md:table-cell"><span className="text-xs px-2 py-0.5 bg-primary/5 text-primary rounded">{app.ayushDomain}</span></td>
                    <td className="py-3 px-3"><StatusBadge status={app.status} size="sm" /></td>
                    <td className="py-3 px-3 text-text-secondary hidden sm:table-cell">{formatDate(app.submittedAt)}</td>
                    <td className="py-3 px-3 text-right"><Link to={`/officer/applications/${app.id}`} className="text-primary text-xs font-medium hover:underline">Review</Link></td>
                  </motion.tr>
                ))}
                {!applicationLoading && recent.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-text-secondary">No applications assigned yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

