import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  UserCircle,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginAsRole } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [demoLoading, setDemoLoading] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const navigateByRole = (role) => {
    const destinations = {
      startup: '/dashboard',
      officer: '/officer/dashboard',
      admin: '/admin/dashboard',
    };
    navigate(destinations[role] || '/dashboard');
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setLoginError('');
    try {
      const user = await login(data.email, data.password);
      navigateByRole(user.role);
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setDemoLoading(role);
    setLoginError('');
    try {
      const user = await loginAsRole(role);
      navigateByRole(user.role);
    } catch (err) {
      setLoginError(err.message || 'Demo login failed.');
    } finally {
      setDemoLoading('');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">
              AYUSH Setu
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome back
          </h1>
          <p className="text-text-secondary mb-8">
            Sign in to your account to continue
          </p>

          {/* Error */}
          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6"
            >
              {loginError}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={`input-field pl-11 w-full ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`input-field pl-11 pr-11 w-full ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Password reset functionality will be available soon.')}
                className="text-sm text-primary hover:text-accent font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-secondary font-medium">
              or try a demo account
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Demo Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleDemoLogin('startup')}
              disabled={!!demoLoading}
              className="flex flex-col items-center gap-1.5 px-3 py-3 border-2 border-emerald-300 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {demoLoading === 'startup' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserCircle className="w-5 h-5" />
              )}
              Startup
            </button>
            <button
              onClick={() => handleDemoLogin('officer')}
              disabled={!!demoLoading}
              className="flex flex-col items-center gap-1.5 px-3 py-3 border-2 border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {demoLoading === 'officer' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
              Officer
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={!!demoLoading}
              className="flex flex-col items-center gap-1.5 px-3 py-3 border-2 border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {demoLoading === 'admin' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Settings className="w-5 h-5" />
              )}
              Admin
            </button>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-text-secondary mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-accent font-semibold transition-colors">
              Register
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right: Decorative Panel */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-secondary items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract decorations */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-56 h-56 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 border border-white/10 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-white/10 rounded-lg rotate-45" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 text-center max-w-sm"
        >
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            AYUSH Setu Portal
          </h2>
          <p className="text-white/70 leading-relaxed">
            Your gateway to the unified AYUSH startup registration ecosystem. Simplifying compliance, accelerating growth.
          </p>
          <div className="mt-10 flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
