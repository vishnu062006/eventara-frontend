'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitch: () => void;
}

export default function AuthModal({ mode, onClose, onSwitch }: AuthModalProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await api.post('/api/users/register', form);
        onSwitch();
      } else {
        const res = await api.post('/api/users/login', { email: form.email, password: form.password });
        login(res.data);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#0d1117] border border-[#30363d] rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="text-4xl font-black text-white mb-1">
            {mode === 'login' ? 'Welcome back.' : 'Join us.'}
          </div>
          <p className="text-[#8b949e]">
            {mode === 'login' ? 'Sign in to your Eventara account' : 'Create your Eventara account'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Vishnu Mashalkar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-style"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-2">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-style"
                >
                  <option value="student">Student</option>
                  <option value="event_admin">Event Admin</option>
                  <option value="admin">Overall Admin</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              placeholder="vishnu@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-style"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-style"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#58a6ff] hover:bg-[#79b8ff] disabled:opacity-50 text-[#060910] font-black text-base rounded-xl py-4 transition-colors mt-2"
          >
            {loading ? '...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </motion.button>
        </div>

        {/* Switch */}
        <div className="mt-6 text-center text-sm text-[#8b949e]">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={onSwitch} className="text-[#58a6ff] hover:underline font-bold">
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}