import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Leaf,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(10, 'Please enter a valid mobile number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const benefits = [
  'Guided multi-step registration wizard',
  'Smart document checklist by domain',
  'Real-time application tracking',
  'Direct communication with reviewers',
  'Access to AYUSH resources & support',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    if (!agreedToTerms) {
      setRegisterError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    setRegisterError('');
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      navigate('/dashboard');
    } catch (err) {
      setRegisterError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">
              AYUSH Setu
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Create your account
          </h1>
          <p className="text-text-secondary mb-8">
            Start your AYUSH startup registration journey
          </p>

          {/* Error */}
          {registerError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6"
            >
              {registerError}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Rajesh Kumar"
                  {...register('name')}
                  className={`input-field pl-11 w-full ${errors.name ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

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

            {/* Phone */}
            <div>
              <label className="label">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                  className={`input-field pl-11 w-full ${errors.phone ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  {...register('confirmPassword')}
                  className={`input-field pl-11 pr-11 w-full ${errors.confirmPassword ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (e.target.checked) setRegisterError('');
                }}
                className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-text-secondary leading-snug">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => alert('Terms of Service will be available soon.')}
                  className="text-primary hover:text-accent font-medium"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => alert('Privacy Policy will be available soon.')}
                  className="text-primary hover:text-accent font-medium"
                >
                  Privacy Policy
                </button>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-text-secondary mt-8">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-accent font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right: Decorative Panel */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-secondary items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract decorations */}
        <div className="absolute top-16 left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-32 h-32 border border-white/10 rounded-full" />
        <div className="absolute bottom-1/3 left-1/4 w-20 h-20 border border-white/10 rounded-lg rotate-12" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 max-w-sm"
        >
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Join AYUSH Setu
          </h2>
          <p className="text-white/70 leading-relaxed text-center mb-10">
            Register your startup and access a complete suite of tools for AYUSH sector compliance and growth.
          </p>

          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                <span className="text-white/80 text-sm">{benefit}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-10 flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
