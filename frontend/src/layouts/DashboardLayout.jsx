import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  Building2,
  FileText,
  FolderOpen,
  BookOpen,
  BellRing,
  ClipboardList,
  Users,
  Shield,
  Tag,
  ScrollText,
  HelpCircle,
  Settings,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ErrorBoundary from '../components/common/ErrorBoundary';

const sidebarNav = {
  startup: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/profile', label: 'Startup Profile', icon: Building2 },
    { to: '/dashboard/applications', label: 'Applications', icon: FileText },
    { to: '/dashboard/documents', label: 'Documents', icon: FolderOpen },
    { to: '/dashboard/guidance', label: 'Regulatory Guidance', icon: Compass },
    { to: '/dashboard/resources', label: 'Resources', icon: BookOpen },
    { to: '/dashboard/notifications', label: 'Notifications', icon: BellRing },
  ],
  officer: [
    { to: '/officer/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/officer/applications', label: 'Applications', icon: ClipboardList },
    { to: '/officer/notifications', label: 'Notifications', icon: BellRing },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
    { to: '/admin/notifications', label: 'Notifications', icon: BellRing },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/officers', label: 'Officers', icon: Shield },
    { to: '/admin/categories', label: 'Categories', icon: Tag },
    { to: '/admin/resources', label: 'Resources', icon: BookOpen },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  ],
};

const sidebarOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const sidebarSlideVariants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    x: '-100%',
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
};

export default function DashboardLayout({ role = 'startup' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const userMenuRef = useRef(null);

  const navItems = sidebarNav[role] || sidebarNav.startup;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchQuery('');
    }
  };

  const userDisplayName = user?.name || user?.email || 'User';
  const userInitials = userDisplayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Sidebar Header */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#145A43]">
          <Leaf className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-[#145A43] tracking-tight">
          AYUSH Setu
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end || false}
                className={({ isActive }) =>
                  `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'sidebar-link-active bg-[#145A43]/10 text-[#145A43]'
                      : 'text-[#6B756F] hover:bg-gray-50 hover:text-[#202A25]'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Bottom */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-1">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6B756F] hover:bg-gray-50 hover:text-[#202A25] transition-colors duration-200"
          onClick={() => {}}
        >
          <HelpCircle className="h-[18px] w-[18px] shrink-0" />
          <span>Help &amp; Support</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F7F9F6] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col bg-white border-r border-gray-100">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="sidebar-overlay"
              variants={sidebarOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="sidebar-mobile"
              variants={sidebarSlideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden"
            >
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#6B756F] hover:bg-gray-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
          {/* Left section: mobile hamburger & portal indicator */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[#202A25] hover:bg-gray-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand - mobile only */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#145A43]">
                <Leaf className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-[#145A43]">AYUSH Setu</span>
            </div>

            {/* Desktop Portal Badge */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-[#6B756F]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#145A43]" />
              <span className="capitalize">{role} Portal</span>
            </div>
          </div>

          {/* Centrally Aligned Search Box */}
          <div className="hidden sm:flex flex-1 max-w-md mx-6 justify-center">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B756F]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applications, startups, documents..."
                  className="w-full h-9 rounded-full border border-gray-200 bg-[#F7F9F6] pl-9 pr-4 text-sm text-[#202A25] placeholder:text-[#6B756F] focus:outline-none focus:ring-2 focus:ring-[#145A43]/20 focus:border-[#145A43] focus:bg-white transition-all duration-200"
                />
              </div>
            </form>
          </div>

          {/* Top-Right Corner Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => {
                const notifPath =
                  role === 'startup'
                    ? '/dashboard/notifications'
                    : role === 'officer'
                    ? '/officer/notifications'
                    : '/admin/notifications';
                navigate(notifPath);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#6B756F] hover:bg-gray-100 hover:text-[#202A25] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E99B35] px-1 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#145A43] text-white text-xs font-semibold">
                  {userInitials}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-[#202A25] leading-tight">
                    {userDisplayName}
                  </span>
                  <span className="text-[11px] text-[#6B756F] capitalize leading-tight">
                    {role}
                  </span>
                </div>
                <ChevronDown
                  className={`hidden md:block h-4 w-4 text-[#6B756F] transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    key="user-dropdown"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-100 py-1 z-50"
                  >
                    {/* Profile Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-[#202A25] truncate">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-[#6B756F] truncate mt-0.5">
                        {user?.email || 'user@ayushsetu.gov.in'}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          const profilePath =
                            role === 'startup'
                              ? '/dashboard/profile'
                              : role === 'officer'
                              ? '/officer/dashboard'
                              : '/admin/dashboard';
                          navigate(profilePath);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#6B756F] hover:bg-gray-50 hover:text-[#202A25] transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#6B756F] hover:bg-gray-50 hover:text-[#202A25] transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
