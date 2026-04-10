'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [modal, setModal] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated]);

  return (
    <main className="min-h-screen bg-[#060910] flex flex-col items-center justify-center relative overflow-hidden">

      {/* Animated grid background */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(88,166,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(88,166,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#58a6ff] rounded-full opacity-[0.04] blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#d2a8ff] rounded-full opacity-[0.04] blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#58a6ff] rounded-full opacity-[0.02] blur-3xl" />

      {/* Floating event cards */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-24 left-8 md:left-24 bg-[#0d1117] border border-[#30363d] rounded-2xl p-4 w-48 hidden md:block"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-bold">UPCOMING</span>
        </div>
        <p className="text-white text-sm font-bold">Tech Fest 2026</p>
        <p className="text-[#8b949e] text-xs">BMS College · Free</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-24 left-8 md:left-24 bg-[#0d1117] border border-[#30363d] rounded-2xl p-4 w-48 hidden md:block"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-yellow-400 text-xs font-bold">ONGOING</span>
        </div>
        <p className="text-white text-sm font-bold">Hackathon 2026</p>
        <p className="text-[#8b949e] text-xs">IIT Bombay · ₹500</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-32 right-8 md:right-24 bg-[#0d1117] border border-[#30363d] rounded-2xl p-4 w-48 hidden md:block"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#58a6ff] text-xs font-bold">👥 128 registered</span>
        </div>
        <p className="text-white text-sm font-bold">Cultural Fest</p>
        <p className="text-[#8b949e] text-xs">MIT Manipal · Free</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-32 right-8 md:right-24 bg-[#0d1117] border border-[#30363d] rounded-2xl p-4 w-48 hidden md:block"
      >
        <div className="w-full bg-[#21262d] rounded-full h-1.5 mb-2">
          <div className="bg-gradient-to-r from-[#58a6ff] to-[#d2a8ff] h-1.5 rounded-full w-3/4" />
        </div>
        <p className="text-white text-sm font-bold">75/100 slots filled</p>
        <p className="text-[#8b949e] text-xs">Workshop · ₹200</p>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-[#58a6ff]/10 border border-[#58a6ff]/20 rounded-full px-5 py-2 text-[#58a6ff] text-sm font-bold mb-8"
        >
          <span className="w-2 h-2 bg-[#58a6ff] rounded-full animate-pulse" />
          Campus Event Management
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-7xl md:text-[100px] font-black text-white mb-4 tracking-tight leading-none"
        >
          Event
          <span className="bg-gradient-to-r from-[#58a6ff] via-[#79b8ff] to-[#d2a8ff] bg-clip-text text-transparent">
            ara
          </span>
          <span className="text-[#58a6ff]">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[#8b949e] text-xl mb-10 leading-relaxed"
        >
          Discover, register and manage campus events —<br className="hidden md:block" /> all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModal('register')}
            className="px-10 py-4 bg-[#58a6ff] hover:bg-[#79b8ff] text-[#060910] font-black text-lg rounded-2xl transition-colors shadow-2xl shadow-[#58a6ff]/20"
          >
            Get Started →
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModal('login')}
            className="px-10 py-4 bg-transparent border-2 border-[#30363d] hover:border-[#58a6ff]/50 text-white font-bold text-lg rounded-2xl transition-all"
          >
            Sign In
          </motion.button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-8"
        >
          {[
            { value: '100+', label: 'Events' },
            { value: '·', label: '' },
            { value: '5K+', label: 'Students' },
            { value: '·', label: '' },
            { value: '10+', label: 'Colleges' },
          ].map((stat, i) => (
            stat.value === '·' ? (
              <span key={i} className="text-[#30363d] text-2xl">·</span>
            ) : (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-[#8b949e] text-xs">{stat.label}</div>
              </div>
            )
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {modal && (
          <AuthModal
            mode={modal}
            onClose={() => setModal(null)}
            onSwitch={() => setModal(modal === 'login' ? 'register' : 'login')}
          />
        )}
      </AnimatePresence>
    </main>
  );
}