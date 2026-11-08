import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  Heart,
  FlaskConical,
  Atom,
  Droplets,
  UserPlus,
  ClipboardList,
  FileUp,
  BarChart3,
  ClipboardCheck,
  FileSearch,
  Eye,
  BookOpen,
  ShieldCheck,
  Lightbulb,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Building2,
  Rocket,
  Globe,
  Users,
  TrendingUp,
  Landmark,
  Scale,
  ShieldHalf,
} from 'lucide-react';
import { ayushDomains, mockFAQs } from '../../data/mockData';
import PageTransition from '../../layouts/PageTransition';

const domainIcons = { Leaf, Heart, FlaskConical, Atom, Droplets };

/* ──────────────────────────────────────────────────────────────────────
   HERO SECTION
   ────────────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-[#F7F9F6]">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#145A43]/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#E99B35]/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            <motion.div
              variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#145A43]/10 text-[#145A43] text-sm font-medium mb-6">
                <Leaf className="w-4 h-4" />
                Empowering India&apos;s Traditional Medicine Startups
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-tight text-[#202A25] mb-6"
              variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}
              transition={{ duration: 0.5 }}
            >
              Empowering AYUSH Startups.{' '}
              <span className="text-[#145A43]">Simplifying Growth.</span>
            </motion.h1>

            <motion.p
              className="text-lg text-[#6B756F] leading-relaxed mb-8 max-w-xl"
              variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}
              transition={{ duration: 0.5 }}
            >
              A unified digital platform to streamline startup onboarding, simplify regulatory
              guidance, and connect India&apos;s AYUSH innovators with opportunities.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#145A43] text-white font-semibold shadow-lg shadow-[#145A43]/25 hover:bg-[#0D3B2E] transition-colors"
              >
                Register Your Startup
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#145A43] text-[#145A43] font-semibold hover:bg-[#145A43]/5 transition-colors"
              >
                Explore the Platform
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Decorative Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:flex justify-center items-center"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-lg aspect-square">
      {/* Layered geometric backdrop */}
      <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Outer decorative ring */}
        <circle cx="250" cy="250" r="220" stroke="#145A43" strokeWidth="1" strokeDasharray="8 6" opacity="0.2" />
        <circle cx="250" cy="250" r="185" stroke="#E99B35" strokeWidth="1" strokeDasharray="4 8" opacity="0.2" />

        {/* Gradient background shape */}
        <defs>
          <linearGradient id="heroGrad1" x1="100" y1="100" x2="400" y2="400">
            <stop offset="0%" stopColor="#145A43" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#E99B35" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="heroGrad2" x1="250" y1="80" x2="250" y2="420">
            <stop offset="0%" stopColor="#145A43" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0D3B2E" stopOpacity="0.04" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#145A43" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#145A43" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Main hexagonal shape */}
        <polygon
          points="250,70 410,160 410,340 250,430 90,340 90,160"
          fill="url(#heroGrad1)"
          stroke="#145A43"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <polygon
          points="250,110 380,180 380,320 250,390 120,320 120,180"
          fill="url(#heroGrad2)"
          stroke="#145A43"
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Interconnected network nodes */}
        {/* Connection lines */}
        <line x1="250" y1="150" x2="170" y2="220" stroke="#145A43" strokeWidth="1.5" opacity="0.3" />
        <line x1="250" y1="150" x2="330" y2="220" stroke="#145A43" strokeWidth="1.5" opacity="0.3" />
        <line x1="170" y1="220" x2="170" y2="310" stroke="#145A43" strokeWidth="1.5" opacity="0.3" />
        <line x1="330" y1="220" x2="330" y2="310" stroke="#145A43" strokeWidth="1.5" opacity="0.3" />
        <line x1="170" y1="310" x2="250" y2="370" stroke="#145A43" strokeWidth="1.5" opacity="0.3" />
        <line x1="330" y1="310" x2="250" y2="370" stroke="#145A43" strokeWidth="1.5" opacity="0.3" />
        <line x1="170" y1="220" x2="330" y2="310" stroke="#E99B35" strokeWidth="1" opacity="0.2" />
        <line x1="330" y1="220" x2="170" y2="310" stroke="#E99B35" strokeWidth="1" opacity="0.2" />
        <line x1="250" y1="150" x2="250" y2="370" stroke="#145A43" strokeWidth="1" opacity="0.15" />

        {/* Network nodes */}
        <circle cx="250" cy="150" r="22" fill="url(#nodeGlow)" />
        <circle cx="250" cy="150" r="14" fill="#145A43" />
        <circle cx="250" cy="150" r="6" fill="white" opacity="0.9" />

        <circle cx="170" cy="220" r="18" fill="url(#nodeGlow)" />
        <circle cx="170" cy="220" r="11" fill="#E99B35" />
        <circle cx="170" cy="220" r="4.5" fill="white" opacity="0.9" />

        <circle cx="330" cy="220" r="18" fill="url(#nodeGlow)" />
        <circle cx="330" cy="220" r="11" fill="#145A43" />
        <circle cx="330" cy="220" r="4.5" fill="white" opacity="0.9" />

        <circle cx="170" cy="310" r="18" fill="url(#nodeGlow)" />
        <circle cx="170" cy="310" r="11" fill="#145A43" />
        <circle cx="170" cy="310" r="4.5" fill="white" opacity="0.9" />

        <circle cx="330" cy="310" r="18" fill="url(#nodeGlow)" />
        <circle cx="330" cy="310" r="11" fill="#E99B35" />
        <circle cx="330" cy="310" r="4.5" fill="white" opacity="0.9" />

        <circle cx="250" cy="370" r="22" fill="url(#nodeGlow)" />
        <circle cx="250" cy="370" r="14" fill="#145A43" />
        <circle cx="250" cy="370" r="6" fill="white" opacity="0.9" />

        {/* Leaf motifs */}
        <g transform="translate(380, 130) rotate(25)">
          <path d="M0,0 C10,-25 30,-25 30,-5 C30,15 10,15 0,0Z" fill="#145A43" opacity="0.15" />
          <line x1="0" y1="0" x2="22" y2="-5" stroke="#145A43" strokeWidth="0.5" opacity="0.2" />
        </g>
        <g transform="translate(100, 370) rotate(-15)">
          <path d="M0,0 C8,-20 24,-20 24,-4 C24,12 8,12 0,0Z" fill="#E99B35" opacity="0.15" />
          <line x1="0" y1="0" x2="18" y2="-4" stroke="#E99B35" strokeWidth="0.5" opacity="0.2" />
        </g>
        <g transform="translate(400, 360) rotate(45)">
          <path d="M0,0 C6,-15 18,-15 18,-3 C18,9 6,9 0,0Z" fill="#145A43" opacity="0.1" />
        </g>

        {/* Abstract dashboard elements (top-right) */}
        <g transform="translate(340, 90)">
          <rect x="0" y="0" width="70" height="50" rx="6" fill="white" stroke="#145A43" strokeWidth="1" opacity="0.6" />
          <rect x="8" y="28" width="8" height="14" rx="2" fill="#145A43" opacity="0.4" />
          <rect x="20" y="22" width="8" height="20" rx="2" fill="#E99B35" opacity="0.5" />
          <rect x="32" y="16" width="8" height="26" rx="2" fill="#145A43" opacity="0.4" />
          <rect x="44" y="10" width="8" height="32" rx="2" fill="#145A43" opacity="0.6" />
          <rect x="8" y="8" width="30" height="3" rx="1.5" fill="#145A43" opacity="0.15" />
        </g>

        {/* Abstract dashboard element (bottom-left) */}
        <g transform="translate(60, 240)">
          <rect x="0" y="0" width="60" height="42" rx="6" fill="white" stroke="#E99B35" strokeWidth="1" opacity="0.6" />
          <circle cx="18" cy="20" r="10" fill="none" stroke="#E99B35" strokeWidth="2" opacity="0.4" />
          <path d="M18,20 L18,12" stroke="#E99B35" strokeWidth="2" opacity="0.4" />
          <path d="M18,20 L25,17" stroke="#145A43" strokeWidth="1.5" opacity="0.4" />
          <rect x="34" y="12" width="16" height="3" rx="1.5" fill="#145A43" opacity="0.2" />
          <rect x="34" y="19" width="12" height="3" rx="1.5" fill="#E99B35" opacity="0.2" />
          <rect x="34" y="26" width="18" height="3" rx="1.5" fill="#145A43" opacity="0.15" />
        </g>

        {/* Decorative dots */}
        <circle cx="130" cy="130" r="3" fill="#E99B35" opacity="0.4" />
        <circle cx="400" cy="270" r="3" fill="#145A43" opacity="0.4" />
        <circle cx="300" cy="430" r="2.5" fill="#E99B35" opacity="0.3" />
        <circle cx="440" cy="200" r="2" fill="#145A43" opacity="0.3" />
        <circle cx="80" cy="180" r="2.5" fill="#E99B35" opacity="0.3" />
        <circle cx="200" cy="440" r="2" fill="#145A43" opacity="0.25" />
        <circle cx="420" cy="420" r="2" fill="#E99B35" opacity="0.25" />
        <circle cx="70" cy="330" r="2" fill="#145A43" opacity="0.2" />
        <circle cx="350" cy="60" r="2" fill="#E99B35" opacity="0.3" />
        <circle cx="150" cy="80" r="1.5" fill="#145A43" opacity="0.2" />
      </svg>

      {/* Floating animated accents */}
      <motion.div
        className="absolute top-10 right-8 w-3 h-3 rounded-full bg-[#E99B35]/40"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-16 left-6 w-2.5 h-2.5 rounded-full bg-[#145A43]/30"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 right-4 w-2 h-2 rounded-full bg-[#145A43]/20"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   STATISTICS SECTION
   ────────────────────────────────────────────────────────────────────── */
function AnimatedCounter({ target, duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = target;
    const increment = end / (duration * 60);
    let frame;
    const step = () => {
      start += increment;
      if (start < end) {
        setCount(Math.floor(start));
        frame = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

const stats = [
  { icon: Rocket, value: 1200, suffix: '+', label: 'Registered Startups' },
  { icon: ClipboardList, value: 3400, suffix: '+', label: 'Applications Processed' },
  { icon: Globe, value: 5, suffix: '', label: 'AYUSH Domains Covered' },
  { icon: Users, value: 28, suffix: '+', label: 'States Represented' },
];

function StatisticsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="text-center p-6 rounded-xl bg-[#F7F9F6] border border-[#145A43]/8"
              >
                <div className="w-12 h-12 rounded-lg bg-[#145A43]/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#145A43]" />
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-[#202A25] mb-1">
                  <AnimatedCounter target={stat.value} />
                  {stat.suffix}
                </p>
                <p className="text-sm text-[#6B756F]">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-xs text-[#6B756F]/70 mt-6">
          Illustrative figures for demonstration purposes
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   AYUSH DOMAINS SECTION
   ────────────────────────────────────────────────────────────────────── */
function DomainsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 bg-[#F7F9F6]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#202A25] mb-4">
            Explore AYUSH Domains
          </h2>
          <p className="text-[#6B756F] max-w-2xl mx-auto text-lg">
            Discover the five pillars of India&apos;s traditional medicine systems
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ayushDomains.map((domain, i) => {
            const Icon = domainIcons[domain.icon];
            return (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-transparent hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: domain.bgColor }}
                  >
                    {Icon && <Icon className="w-7 h-7" style={{ color: domain.color }} />}
                  </div>
                  <h3 className="text-xl font-semibold text-[#202A25] mb-2">{domain.name}</h3>
                  <p className="text-[#6B756F] text-sm leading-relaxed mb-4">{domain.description}</p>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#145A43] hover:text-[#0D3B2E] transition-colors"
                  >
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   HOW IT WORKS SECTION
   ────────────────────────────────────────────────────────────────────── */
const steps = [
  {
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up with your email and verify your identity to get started on the platform.',
  },
  {
    icon: ClipboardList,
    title: 'Complete Startup Registration',
    description: 'Fill in your startup details, select your AYUSH domain, and provide business information.',
  },
  {
    icon: FileUp,
    title: 'Submit Required Documents',
    description: 'Upload necessary documents based on your smart checklist tailored to your domain.',
  },
  {
    icon: BarChart3,
    title: 'Track Your Application',
    description: 'Monitor your application status in real-time and respond to any review feedback.',
  },
];

function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 bg-[#145A43]/[0.03]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#202A25] mb-4">How It Works</h2>
          <p className="text-[#6B756F] max-w-2xl mx-auto text-lg">
            Get your AYUSH startup registered in four simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#145A43]/20 via-[#145A43]/30 to-[#145A43]/20" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 w-16 h-16 rounded-full bg-[#145A43] flex items-center justify-center mb-5 shadow-lg shadow-[#145A43]/20">
                  <Icon className="w-7 h-7 text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#E99B35] text-white text-xs font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#202A25] mb-2">{step.title}</h3>
                <p className="text-sm text-[#6B756F] leading-relaxed max-w-xs">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   FEATURES SECTION
   ────────────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: ClipboardCheck,
    title: 'Simplified Registration',
    description: 'Guided step-by-step registration process designed for AYUSH startups.',
    color: '#145A43',
    bg: '#E8F5E9',
  },
  {
    icon: FileSearch,
    title: 'Smart Document Checklist',
    description: 'Domain-specific document requirements tailored to your business type.',
    color: '#E99B35',
    bg: '#FFF8E1',
  },
  {
    icon: Eye,
    title: 'Transparent Tracking',
    description: 'Real-time application status tracking with detailed timeline.',
    color: '#1565C0',
    bg: '#E3F2FD',
  },
  {
    icon: BookOpen,
    title: 'Regulatory Guidance',
    description: 'Interactive guidance engine to discover applicable regulatory requirements.',
    color: '#7B1FA2',
    bg: '#F3E5F5',
  },
  {
    icon: ShieldCheck,
    title: 'Government Verification',
    description: 'Streamlined verification process by assigned government officers.',
    color: '#00838F',
    bg: '#E0F7FA',
  },
  {
    icon: Lightbulb,
    title: 'Startup Resources',
    description: 'Access government schemes, guidelines, and support resources.',
    color: '#E65100',
    bg: '#FFF3E0',
  },
];

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#202A25] mb-4">
            Why Choose AYUSH Setu?
          </h2>
          <p className="text-[#6B756F] max-w-2xl mx-auto text-lg">
            Everything you need to register, manage, and grow your AYUSH startup
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="p-6 rounded-xl border border-gray-100 bg-[#F7F9F6] hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: feat.bg }}
                >
                  <Icon className="w-6 h-6" style={{ color: feat.color }} />
                </div>
                <h3 className="text-lg font-semibold text-[#202A25] mb-2">{feat.title}</h3>
                <p className="text-sm text-[#6B756F] leading-relaxed">{feat.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   GOVERNMENT RESOURCES SECTION
   ────────────────────────────────────────────────────────────────────── */
const govResources = [
  {
    icon: Landmark,
    title: 'Ministry of AYUSH',
    description: 'Official portal for policies, guidelines, and notifications from the Ministry of AYUSH.',
    url: 'https://ayush.gov.in',
  },
  {
    icon: Rocket,
    title: 'Startup India',
    description: 'Register your startup, access funding, tax exemptions, and ecosystem resources.',
    url: 'https://www.startupindia.gov.in',
  },
  {
    icon: Building2,
    title: 'DPIIT',
    description: 'Department for Promotion of Industry and Internal Trade — startup recognition.',
    url: 'https://dpiit.gov.in',
  },
  {
    icon: Scale,
    title: 'FSSAI',
    description: 'Food safety licensing and compliance requirements for AYUSH food products.',
    url: 'https://fssai.gov.in',
  },
];

function GovernmentResourcesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 bg-[#F7F9F6]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#202A25] mb-4">
            Official Resources & Partners
          </h2>
          <p className="text-[#6B756F] max-w-2xl mx-auto text-lg">
            Access official government portals and partner resources
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {govResources.map((res, i) => {
            const Icon = res.icon;
            return (
              <motion.a
                key={res.title}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="group block p-6 rounded-xl bg-white border border-gray-100 hover:shadow-lg hover:border-[#145A43]/20 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[#145A43]/8 flex items-center justify-center mb-4 group-hover:bg-[#145A43]/15 transition-colors">
                  <Icon className="w-6 h-6 text-[#145A43]" />
                </div>
                <h3 className="text-base font-semibold text-[#202A25] mb-2">{res.title}</h3>
                <p className="text-sm text-[#6B756F] leading-relaxed mb-4">{res.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-[#145A43] group-hover:text-[#0D3B2E] transition-colors">
                  Visit Portal <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   FAQ SECTION
   ────────────────────────────────────────────────────────────────────── */
function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F7F9F6] transition-colors"
      >
        <span className="text-[#202A25] font-medium pr-4">{faq.question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#6B756F]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 text-sm text-[#6B756F] leading-relaxed border-t border-gray-50 pt-4">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const displayFAQs = mockFAQs.slice(0, 6);

  return (
    <section className="py-20 bg-white" ref={ref}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#202A25] mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-[#6B756F] text-lg">
            Find answers to the most common questions about AYUSH Setu
          </p>
        </motion.div>

        <div className="space-y-3">
          {displayFAQs.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <FAQItem faq={faq} />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
        >
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 text-[#145A43] font-medium hover:text-[#0D3B2E] transition-colors"
          >
            View All FAQs <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   CTA SECTION
   ────────────────────────────────────────────────────────────────────── */
function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 bg-[#F7F9F6]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#145A43] via-[#0D3B2E] to-[#145A43] p-10 sm:p-14 text-center"
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#E99B35]/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Start Your AYUSH Journey?
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Join thousands of AYUSH startups on India&apos;s premier facilitation platform.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[#E99B35] text-white font-semibold shadow-lg shadow-[#E99B35]/30 hover:bg-[#d48a2a] transition-colors"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   LANDING PAGE
   ────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <PageTransition>
      <HeroSection />
      <StatisticsSection />
      <DomainsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <GovernmentResourcesSection />
      <FAQSection />
      <CTASection />
    </PageTransition>
  );
}
