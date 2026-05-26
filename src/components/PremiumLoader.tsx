'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PremiumLoader() {
  const [progress, setProgress] = useState(0);

  // Simulate a loading progress metric
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Random fluid increments
        return prev + Math.floor(Math.random() * 15) + 1;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#030303] selection:bg-white/10">
      
      {/* 1. Animated Ambient Background Blobs (Liquid vibe) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none blur-[100px] opacity-60">
        <motion.div
          animate={{
            x: ['-20%', '20%', '-20%'],
            y: ['-20%', '20%', '-20%'],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-purple-600/30 rounded-full mix-blend-screen"
        />
        <motion.div
          animate={{
            x: ['20%', '-20%', '20%'],
            y: ['20%', '-20%', '20%'],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-blue-600/30 rounded-full mix-blend-screen"
        />
      </div>

      {/* 2. Central Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // Custom spring curve
        className="relative z-10 flex flex-col items-center p-10 overflow-hidden border bg-white/[0.03] backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] min-w-[320px]"
      >
        {/* Shine highlight on the glass */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* 3. Liquid Morphing Shape */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-8">
          <motion.div
            animate={{
              rotate: 360,
              borderRadius: [
                '30% 70% 70% 30% / 30% 30% 70% 70%',
                '70% 30% 30% 70% / 70% 70% 30% 30%',
                '30% 70% 70% 30% / 30% 30% 70% 70%',
              ],
            }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
              borderRadius: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 blur-[2px]"
          />
          <motion.div
            animate={{
              rotate: -360,
              borderRadius: [
                '60% 40% 30% 70% / 60% 30% 70% 40%',
                '30% 70% 70% 30% / 30% 30% 70% 70%',
                '60% 40% 30% 70% / 60% 30% 70% 40%',
              ],
            }}
            transition={{
              rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
              borderRadius: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute inset-0 bg-[var(--bg)] border border-white/20 z-10 flex items-center justify-center backdrop-blur-md"
          >
            {/* Inner pulsing dot */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            />
          </motion.div>
        </div>

        {/* 4. Text & Percentage */}
        <div className="flex flex-col items-center w-full gap-2 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg font-bold tracking-widest text-transparent uppercase bg-clip-text bg-gradient-to-r from-white to-white/50"
          >
            Loading Experience
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-end gap-1 font-mono text-3xl font-light text-white"
          >
            {Math.min(progress, 100)}
            <span className="text-sm font-bold text-white/40 mb-1.5">%</span>
          </motion.div>
        </div>

        {/* 5. Minimalist Progress Bar */}
        <div className="w-full h-1 mt-8 overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>
      </motion.div>
    </div>
  );
}