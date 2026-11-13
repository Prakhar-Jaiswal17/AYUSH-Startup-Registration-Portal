import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, Files, Plus, ArrowRight, AlertCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import PageTransition from '../../layouts/PageTransition';
import { formatDate, formatRelativeTime } from '../../utils/helpers';

export default function StartupDashboard() {
  const { user, startup, isApiSession, startupLoading } = useAuth();
  const { applications, documents, getApplicationsByStartup, getDocumentsByStartup, resetToMockData, applicationLoading, applicationError, refreshApplications } = useApplications();

  const myApps = isApiSession
    ? (applications || [])
    : (startup?.id ? getApplicationsByStartup(startup.id) : (applications || []).filter(a => a?.startupId === 'stp_001'));
  const myDocs = isApiSession
    ? []
    : (startup?.id ? getDocumentsByStartup(startup.id) : (documents || []).filter(d => d?.startupId === 'stp_001'));
  const pendingApps = myApps.filter(a => ['Submitted', 'Under Review', 'Resubmitted'].includes(a?.status));
  const approvedApps = myApps.filter(a => a?.status === 'Approved');
  const latestApp = myApps.length > 0 ? myApps.reduce((a, b) => new Date(b?.lastUpdated || 0) > new Date(a?.lastUpdated || 0) ? b : a) : null;
  const actionItems = myApps.filter(a => ['Draft', 'Clarification Required'].includes(a?.status));

  const allTimeline = myApps
    .flatMap(app => (app?.timeline || []).map(t => ({ ...t, appId: app?.id })))
    .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
    .slice(0, 5);

  const getProgress = (status) => {
    const map = { Draft: 16, Submitted: 33, 'Under Review': 50, 'Clarification Required': 66, Resubmitted: 66, Approved: 100, Rejected: 100 };
    return map[status] || 0;
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-text-primary">
              Welcome back, {user?.name || 'Entrepreneur'}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-text-secondary mt-1">
              {startupLoading ? 'Loading startup profile…' : (startup?.brandName || (isApiSession ? 'Startup profile not created' : 'VedaCure Wellness Pvt. Ltd.'))} &middot; {today}
            </motion.p>
          </div>
          {!isApiSession && myApps.length === 0 && (
            <button
              onClick={resetToMockData}
              className="btn-secondary text-xs inline-flex items-center gap-1.5 self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reload Demo Data
            </button>
          )}
        </div>

        {applicationError && isApiSession && (
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="alert">
            <p className="text-sm text-error">{applicationError}</p>
            <button onClick={() => refreshApplications().catch(() => {})} className="btn-secondary inline-flex items-center gap-2 text-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} value={myApps.length} label="Total Applications" />
          <StatCard icon={Clock} value={pendingApps.length} label="Pending Review" />
          <StatCard icon={CheckCircle2} value={approvedApps.length} label="Approved" />
          <StatCard icon={Files} value={isApiSession ? '—' : myDocs.length} label={isApiSession ? 'Documents (not connected)' : 'Documents'} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Current Application Status */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="font-semibold text-text-primary mb-4">Current Application Status</h2>
            {applicationLoading && isApiSession ? (
              <div role="status" className="text-sm text-text-secondary py-8 text-center">Loading your applications…</div>
            ) : latestApp ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-text-secondary">Application ID</p>
                    <p className="font-medium text-base text-text-primary">{latestApp.id}</p>
                  </div>
                  <StatusBadge status={latestApp.status} />
                </div>
                <p className="text-sm text-text-secondary mb-2">{latestApp.ayushDomain}{latestApp.submittedAt ? ` · Submitted ${formatDate(latestApp.submittedAt)}` : ' · Draft'}</p>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3">
                  <motion.div
                    className={`h-2.5 rounded-full ${latestApp.status === 'Rejected' ? 'bg-error' : 'bg-primary'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress(latestApp.status)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary mt-1.5">
                  <span>Draft</span><span>Submitted</span><span>Review</span><span>Decision</span>
                </div>
                <Link to={`/dashboard/applications/${latestApp.id}`} className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-4 hover:underline">
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-text-secondary/40 mx-auto mb-2" />
                <p className="text-text-secondary text-sm">No applications yet</p>
                <Link to="/dashboard/applications/new" className="btn-primary mt-3 inline-flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Start Application
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="font-semibold text-text-primary mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/dashboard/applications/new" className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors group">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><Plus className="w-4 h-4 text-primary" /></div>
                <div><p className="text-sm font-medium text-text-primary">New Application</p><p className="text-xs text-text-secondary">Start a new registration</p></div>
              </Link>
              {isApiSession ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50" aria-disabled="true">
                  <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center"><Files className="w-4 h-4 text-accent" /></div>
                  <div><p className="text-sm font-medium text-text-primary">Document Upload</p><p className="text-xs text-text-secondary">Not connected yet</p></div>
                </div>
              ) : (
                <Link to="/dashboard/documents" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center"><Files className="w-4 h-4 text-accent" /></div>
                  <div><p className="text-sm font-medium text-text-primary">Upload Documents</p><p className="text-xs text-text-secondary">Manage your files</p></div>
                </Link>
              )}
              <Link to="/dashboard/guidance" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-emerald-800" /></div>
                <div><p className="text-sm font-medium text-text-primary">Regulatory Guidance</p><p className="text-xs text-text-secondary">Tailored compliance rules</p></div>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="card p-6">
            <h2 className="font-semibold text-text-primary mb-4">Recent Activity</h2>
            {allTimeline.length > 0 ? (
              <div className="space-y-3">
                {allTimeline.map((event, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary">{event.remark}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{event.appId} &middot; {formatRelativeTime(event.date)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary text-center py-4">{isApiSession ? 'Open an application to view its server status history.' : 'No recent activity'}</p>
            )}
          </div>

          {/* Pending Actions */}
          <div className="card p-6">
            <h2 className="font-semibold text-text-primary mb-4">Pending Actions</h2>
            {actionItems.length > 0 ? (
              <div className="space-y-3">
                {actionItems.map((app) => (
                  <Link key={app.id} to={`/dashboard/applications/${app.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border-light hover:border-primary/20 transition-colors">
                    <AlertCircle className={`w-5 h-5 shrink-0 ${app.status === 'Draft' ? 'text-text-secondary' : 'text-warning'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{app.id}</p>
                      <p className="text-xs text-text-secondary">
                        {app.status === 'Draft'
                          ? 'Complete and submit your draft application'
                          : (isApiSession ? 'Clarification response is not connected yet' : 'Respond to clarification request')}
                      </p>
                    </div>
                    <StatusBadge status={app.status} size="sm" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-success/40 mx-auto mb-2" />
                <p className="text-sm text-text-secondary">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
