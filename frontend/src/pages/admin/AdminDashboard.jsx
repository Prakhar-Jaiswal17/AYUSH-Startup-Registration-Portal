import { motion } from 'framer-motion';
import { Users, FileText, CheckCircle2, UserCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApplications } from '../../context/ApplicationContext';
import { mockStartups, mockAnalytics } from '../../data/mockData';
import StatCard from '../../components/common/StatCard';
import PageTransition from '../../layouts/PageTransition';

const DOMAIN_COLORS = ['#2D7D46', '#7B1FA2', '#00838F', '#E65100', '#1565C0'];

export default function AdminDashboard() {
  const { applications } = useApplications();
  const totalStartups = mockStartups.length;
  const totalApps = applications.length;
  const approvedApps = applications.filter(a => a.status === 'Approved').length;
  const approvalRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Platform-wide analytics and oversight.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} value={totalStartups} label="Registered Startups" />
          <StatCard icon={FileText} value={totalApps} label="Total Applications" />
          <StatCard icon={CheckCircle2} value={`${approvalRate}%`} label="Approval Rate" />
          <StatCard icon={UserCheck} value={1} label="Active Officers" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Registration Trend */}
          <div className="card p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Monthly Registration Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockAnalytics.registrationTrend}>
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

          {/* Domain Distribution */}
          <div className="card p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Applications by AYUSH Domain</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mockAnalytics.applicationsByDomain} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="count" nameKey="domain" label={({ domain, count }) => `${domain}: ${count}`} labelLine={false} fontSize={11}>
                    {mockAnalytics.applicationsByDomain.map((_, i) => (
                      <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8E4', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Application Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAnalytics.applicationsByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E4" />
                  <XAxis type="number" fontSize={12} tickLine={false} stroke="#6B756F" />
                  <YAxis dataKey="status" type="category" fontSize={11} tickLine={false} stroke="#6B756F" width={90} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8E4', fontSize: '13px' }} />
                  <Bar dataKey="count" fill="#145A43" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top States */}
          <div className="card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Top States by Startup Count</h3>
            <div className="space-y-3">
              {mockAnalytics.stateDistribution.slice(0, 8).map((item, i) => (
                <motion.div key={item.state} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary w-28 shrink-0 truncate">{item.state}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <motion.div className="h-2.5 bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${(item.count / mockAnalytics.stateDistribution[0].count) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} />
                  </div>
                  <span className="text-sm font-medium text-text-primary w-8 text-right">{item.count}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

