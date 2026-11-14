import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ScrollToTop from './components/common/ScrollToTop.jsx';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Public pages
import LandingPage from './pages/public/LandingPage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import HowItWorksPage from './pages/public/HowItWorksPage.jsx';
import ResourcesPage from './pages/public/ResourcesPage.jsx';
import FAQPage from './pages/public/FAQPage.jsx';

// Auth pages
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';

// Startup pages
import StartupDashboard from './pages/startup/StartupDashboard.jsx';
import StartupProfile from './pages/startup/StartupProfile.jsx';
import ApplicationsList from './pages/startup/ApplicationsList.jsx';
import NewApplication from './pages/startup/NewApplication.jsx';
import ApplicationDetail from './pages/startup/ApplicationDetail.jsx';
import DocumentManagement from './pages/startup/DocumentManagement.jsx';
import StartupResources from './pages/startup/StartupResources.jsx';
import NotificationsPage from './pages/startup/NotificationsPage.jsx';
import RegulatoryGuidance from './pages/startup/RegulatoryGuidance.jsx';

// Officer pages
import OfficerDashboard from './pages/officer/OfficerDashboard.jsx';
import OfficerApplications from './pages/officer/OfficerApplications.jsx';
import OfficerApplicationReview from './pages/officer/OfficerApplicationReview.jsx';
import OfficerNotifications from './pages/officer/OfficerNotifications.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminApplications from './pages/admin/AdminApplications.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminOfficers from './pages/admin/AdminOfficers.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminResources from './pages/admin/AdminResources.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirects = { startup: '/dashboard', officer: '/officer/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={redirects[user.role] || '/login'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/guidance" element={<RegulatoryGuidance />} />
      </Route>

      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Startup routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['startup']}>
            <DashboardLayout role="startup" />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<StartupDashboard />} />
        <Route path="/dashboard/profile" element={<StartupProfile />} />
        <Route path="/dashboard/applications" element={<ApplicationsList />} />
        <Route path="/dashboard/applications/new" element={<NewApplication />} />
        <Route path="/dashboard/applications/:id" element={<ApplicationDetail />} />
        <Route path="/dashboard/documents" element={<DocumentManagement />} />
        <Route path="/dashboard/guidance" element={<RegulatoryGuidance />} />
        <Route path="/dashboard/resources" element={<StartupResources />} />
        <Route path="/dashboard/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Officer routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <DashboardLayout role="officer" />
          </ProtectedRoute>
        }
      >
        <Route path="/officer/dashboard" element={<OfficerDashboard />} />
        <Route path="/officer/applications" element={<OfficerApplications />} />
        <Route path="/officer/applications/:id" element={<OfficerApplicationReview />} />
        <Route path="/officer/notifications" element={<OfficerNotifications />} />
      </Route>

      {/* Admin routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/applications" element={<AdminApplications />} />
        <Route path="/admin/applications/:id" element={<OfficerApplicationReview />} />
        <Route path="/admin/notifications" element={<OfficerNotifications />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/officers" element={<AdminOfficers />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/resources" element={<AdminResources />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

