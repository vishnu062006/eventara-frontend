'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#060910] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d1117] border border-red-500/30 rounded-3xl p-10 max-w-md w-full text-center"
      >
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-white font-black text-2xl mb-2">Access Denied</h1>
        <p className="text-[#8b949e] mb-6">
          {reason === 'domain'
            ? 'Only @bmsce.ac.in email addresses are allowed to access Eventara.'
            : 'Something went wrong during sign in.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-[#58a6ff] text-[#060910] font-black px-6 py-3 rounded-xl hover:bg-[#79b8ff] transition-colors"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060910] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}