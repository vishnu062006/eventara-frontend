'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import axios from 'axios';

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

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        <div className="mb-8">
          <div className="text-4xl font-black text-white mb-1">
            {mode === 'login' ? 'Welcome back.' : 'Join us.'}
          </div>
          <p className="text-[#8b949e]">
            {mode === 'login'
              ? 'Sign in to your Eventara account'
              : 'Create your Eventara account'}
          </p>
        </div>

        <div className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Vishnu Mashalkar"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="input-style"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="vishnu@example.com"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="input-style"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
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
            {loading
              ? '...'
              : mode === 'login'
              ? 'Sign In →'
              : 'Create Account →'}
          </motion.button>
        </div>

        <div className="mt-6 text-center text-sm text-[#8b949e]">
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            onClick={onSwitch}
            className="text-[#58a6ff] hover:underline font-bold"
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#30363d]" />
            <span className="text-[#8b949e] text-xs font-bold">OR</span>
            <div className="flex-1 h-px bg-[#30363d]" />
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-black text-sm rounded-xl py-3 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
              />
              <path
                fill="#34A853"
                d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
              />
              <path
                fill="#FBBC05"
                d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"
              />
              <path
                fill="#EA4335"
                d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"
              />
            </svg>
            Continue with Google
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}