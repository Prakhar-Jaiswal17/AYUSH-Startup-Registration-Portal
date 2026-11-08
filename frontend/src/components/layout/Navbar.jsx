import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/resources', label: 'Resources' },
  { to: '/faq', label: 'FAQs' },
];

const sidebarVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const linkClass = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-[#145A43]'
        : 'text-[#6B756F] hover:text-[#145A43]'
    }`;

  const activeDot = (
    <motion.span
      layoutId="nav-active-dot"
      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#E99B35]"
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    />
  );

  return (
    <header
      className={`sticky top-0 z-50 h-16 w-full backdrop-blur-md transition-shadow duration-300 ${
        scrolled
          ? 'bg-white/95 shadow-sm border-b border-gray-100'
          : 'bg-white/80 border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#145A43]">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold text-[#145A43] tracking-tight">
              AYUSH Setu
            </span>
            <span className="text-[10px] text-[#6B756F] tracking-wide">
              Startup Portal
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
              {({ isActive }) => (
                <span className="relative">
                  {link.label}
                  {isActive && activeDot}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-[#145A43] border border-[#145A43] rounded-lg hover:bg-[#145A43]/5 transition-colors duration-200"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-[#145A43] rounded-lg hover:bg-[#0D3B2E] transition-colors duration-200 shadow-sm"
          >
            Register Startup
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden flex items-center justify-center h-10 w-10 rounded-lg text-[#202A25] hover:bg-gray-100 transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mobile-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="mobile-sidebar"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-72 bg-white shadow-xl border-l border-gray-100 lg:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/'}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            isActive
                              ? 'bg-[#145A43]/10 text-[#145A43]'
                              : 'text-[#6B756F] hover:bg-gray-50 hover:text-[#202A25]'
                          }`
                        }
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-100 px-4 py-4 space-y-3">
                  <Link
                    to="/login"
                    className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-[#145A43] border border-[#145A43] rounded-lg hover:bg-[#145A43]/5 transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-[#145A43] rounded-lg hover:bg-[#0D3B2E] transition-colors duration-200 shadow-sm"
                  >
                    Register Startup
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
