'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Mail, Lock, Eye, EyeOff, User, Sparkles, ArrowRight, 
  Loader2, ShieldCheck, CheckCircle2, Ticket, QrCode 
} from 'lucide-react';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitch: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
}

export default function AuthModal({ mode, onClose, onSwitch }: AuthModalProps) {
  const { login } = useAuth();
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Auto-focus email field on mount/mode switch
  useEffect(() => {
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [mode]);

  // Handle Enter key submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // --- PRESERVED BACKEND LOGIC ---
  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await api.post('/api/users/register', {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        onSwitch();
      } else {
        const res = await api.post('/api/users/login', {
          email: form.email,
          password: form.password,
        });
        login(res.data);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            'Something went wrong'
        );
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  // Framer Motion variants for staggered form rendering
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl selection:bg-indigo-500/30"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl min-h-[560px] flex flex-col md:flex-row bg-[#050505] border border-white/10 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)_inset] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* --- LEFT PANEL (BRANDING) - Hidden on Mobile --- */}
          <div className="hidden md:flex md:w-5/12 relative flex-col justify-between p-10 bg-zinc-900 overflow-hidden border-r border-white/5">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

            {/* Floating Ornaments */}
            <motion.div animate={{ y: [0, -10, 0], rotate: [0, -2, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute right-8 top-20 w-16 h-16 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-2xl rotate-12">
              <Ticket size={24} />
            </motion.div>
            <motion.div animate={{ y: [0, 10, 0], rotate: [0, 4, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute right-20 bottom-32 w-12 h-12 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-emerald-400 shadow-2xl -rotate-6">
              <QrCode size={18} />
            </motion.div>

            {/* Top Branding */}
            <div className="relative z-10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="font-bold tracking-tight text-white text-lg">Eventara</span>
            </div>

            {/* Core Message */}
            <div className="relative z-10 mt-auto mb-8">
              <h3 className="text-3xl font-black text-white tracking-tight leading-tight mb-6">
                Your campus.<br/>Unified.
              </h3>
              <ul className="space-y-4">
                {[
                  "Discover campus events instantly",
                  "Secure QR ticketing & access",
                  "Join hackathons seamlessly",
                  "Fast registrations & wallet payments"
                ].map((prop, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-center gap-3 text-sm text-zinc-300 font-medium"
                  >
                    <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                    {prop}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Bottom Trust Microcopy */}
            <div className="relative z-10 pt-6 border-t border-white/10 text-[11px] font-medium text-zinc-500 tracking-wide uppercase">
              Built for ambitious clubs and curious students.
            </div>
          </div>

          {/* --- RIGHT PANEL (AUTH FORM) --- */}
          <div className="w-full md:w-7/12 flex flex-col justify-center p-8 sm:p-12 relative bg-[#050505]">
            
            {/* Mobile-only Branding Header */}
            <div className="md:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="font-bold tracking-tight text-white text-lg">Eventara</span>
            </div>

            {/* Close Button (Subtle top right) */}
            <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
               <span className="sr-only">Close</span>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            {/* Form Header */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full max-w-[340px] mx-auto">
              <motion.div variants={itemVariants} className="mb-8 text-center md:text-left">
                <h2 id="modal-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-sm font-medium text-zinc-400">
                  {mode === 'login'
                    ? 'Access your campus dashboard'
                    : 'Join the campus operating system'}
                </p>
              </motion.div>

              <div className="space-y-4">
                {/* Form Fields */}
                <AnimatePresence mode="popLayout">
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                        Full Name
                      </label>
                      <div className="relative group">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-indigo-400" />
                        <input
                          type="text"
                          placeholder="e.g. Vishnu Mashalkar"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all focus:ring-4 focus:ring-indigo-500/10"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={itemVariants}>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-indigo-400" />
                    <input
                      ref={emailInputRef}
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="flex items-center justify-between mb-1.5 ml-1">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button type="button" className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors focus:outline-none">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-indigo-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -5 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -5 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mt-2 text-[13px] font-medium text-red-400 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                        <span className="leading-tight">{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit CTA */}
                <motion.div variants={itemVariants}>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={loading || !form.email || !form.password || (mode === 'register' && !form.name)}
                    className="group relative w-full bg-white text-black font-bold text-[14px] rounded-xl py-3.5 mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin text-black" />
                    ) : (
                      <>
                        <span className="relative z-10">{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                        <ArrowRight size={16} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-[shimmer_1.5s_infinite] -translate-x-full" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Divider */}
              <motion.div variants={itemVariants} className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-[1px] bg-white/10" />
                <span className="text-xs font-medium text-zinc-600">or</span>
                <div className="flex-1 h-[1px] bg-white/10" />
              </motion.div>

              {/* Google OAuth Button - PRESERVED LOGIC */}
              <motion.div variants={itemVariants}>
                <motion.a
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  href={`${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`}
                  className="mt-6 w-full flex items-center justify-center gap-3 bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] text-white font-semibold text-[14px] rounded-xl py-3 transition-all shadow-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
                    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
                  </svg>
                  Continue with Google
                </motion.a>
              </motion.div>

              {/* Switch Mode & Trust Signal */}
              <motion.div variants={itemVariants} className="mt-8 flex flex-col items-center gap-6">
                <div className="text-sm font-medium text-zinc-400">
                  {mode === 'login' ? "New to Eventara?" : "Already have an account?"}{' '}
                  <button
                    onClick={onSwitch}
                    className="text-white hover:text-indigo-400 transition-colors font-semibold focus:outline-none"
                  >
                    {mode === 'login' ? 'Create your account' : 'Log in'}
                  </button>
                </div>
                
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium tracking-wide">
                  <ShieldCheck size={14} className="text-zinc-500" />
                  Secure Authentication
                </div>
              </motion.div>

            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}