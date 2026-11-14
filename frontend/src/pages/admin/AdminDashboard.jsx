import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, CheckCircle2, UserCheck, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApplications } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import { mockStartups, mockAnalytics } from '../../data/mockData';
import StatCard from '../../components/common/StatCard';
import PageTransition from '../../layouts/PageTransition';

const DOMAIN_COLORS = ['#2D7D46', '#7B1FA2', '#00838F', '#E65100', '#1565C0'];
const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  QUERY_RAISED: 'Clarification Required',
  RESUBMITTED: 'Resubmitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export default function AdminDashboard() {
  const { applications } = useApplications();
  const { isApiSession } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(isApiSession);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isApiSession) {
      setAnalytics(null);
      setLoading(false);
      setError('');
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');
    adminAPI.getAnalytics()
      .then((response) => {
        const data = response?.data?.data;
        if (!response?.data?.success || !data || typeof data !== 'object') {
          throw new Error('The analytics service returned an invalid response.');
        }
        if (active) setAnalytics(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.apiMessage || getApiErrorMessage(requestError, 'Unable to load analytics.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [isApiSession, retryCount]);

  const chartData = useMemo(() => {
    if (!isApiSession || !analytics) return {
      registrationTrend: mockAnalytics.registrationTrend,
      applicationsByDomain: mockAnalytics.applicationsByDomain,
      applicationsByStatus: mockAnalytics.applicationsByStatus,
      stateDistribution: mockAnalytics.stateDistribution,
    };

    return {
      registrationTrend: analytics.registrationTrend || [],
      applicationsByDomain: (analytics.byCategory || []).map(({ categoryName, count }) => ({ domain: categoryName, count })),
      applicationsByStatus: Object.entries(analytics.byStatus || {}).map(([status, count]) => ({ status: STATUS_LABELS[status] || status, count })),
      stateDistribution: analytics.byState || [],
    };
  }, [analytics, isApiSession]);

  const totalStartups = isApiSession ? (analytics?.totalStartups ?? 0) : mockStartups.length;
  const totalApps = isApiSession ? (analytics?.totalApplications ?? 0) : applications.length;
  const approvedApps = isApiSession
    ? (analytics?.byStatus?.APPROVED ?? 0)
    : applications.filter((application) => application.status === 'Approved').length;
  const approvalRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;
  const officerCount = isApiSession ? (analytics?.totalOfficers ?? 0) : 1;
  const largestStateCount = chartData.stateDistribution[0]?.count || 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Platform-wide analytics and oversight.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 flex items-center justify-between gap-3">
            <p role="alert" className="text-sm text-error">{error}</p>
            <button onClick={() => setRetryCount((count) => count + 1)} className="btn-ghost text-sm inline-flex items-center gap-2 shrink-0"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        )}

        {loading && <div role="status" className="card px-4 py-3 text-sm text-text-secondary">Loading analytics…</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} value={totalStartups} label="Registered Startups" />
          <StatCard icon={FileText} value={totalApps} label="Total Applications" />
          <StatCard icon={CheckCircle2} value={`${approvalRate}%`} label="Approval Rate" />
          <StatCard icon={UserCheck} value={officerCount} label="Review Officers" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Monthly Registration Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E4" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} stroke="#6B756F" />
                  <YAxis fontSize={12} tickLine={false} stroke="#6B756F" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8E4', fontSize: '13px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="startups" stroke="#145A43" fill="#145A43" fillOpacity={0.15} strokeWidth={2} name="Startups" />
                  <Area type="monotone" dataKey="applications" stroke="#E99B35" fill="#E99B35" fillOpacity={0.1} strokeWidth={2} name="Applications" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Applications by AYUSH Domain</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.applicationsByDomain} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="count" nameKey="domain" label={({ domain, count }) => `${domain}: ${count}`} labelLine={false} fontSize={11}>
                    {chartData.applicationsByDomain.map((item, index) => <Cell key={item.domain} fill={DOMAIN_COLORS[index % DOMAIN_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8E4', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Application Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.applicationsByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E4" />
                  <XAxis type="number" fontSize={12} tickLine={false} stroke="#6B756F" />
                  <YAxis dataKey="status" type="category" fontSize={11} tickLine={false} stroke="#6B756F" width={120} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8E4', fontSize: '13px' }} />
                  <Bar dataKey="count" fill="#145A43" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Top States by Startup Count</h3>
            <div className="space-y-3">
              {chartData.stateDistribution.slice(0, 8).map((item, index) => (
                <motion.div key={item.state} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary w-28 shrink-0 truncate">{item.state}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <motion.div className="h-2.5 bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${largestStateCount ? (item.count / largestStateCount) * 100 : 0}%` }} transition={{ duration: 0.6, delay: index * 0.05 }} />
                  </div>
                  <span className="text-sm font-medium text-text-primary w-8 text-right">{item.count}</span>
                </motion.div>
              ))}
              {chartData.stateDistribution.length === 0 && <p className="text-sm text-text-secondary">No startup location data yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
