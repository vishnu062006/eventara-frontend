'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, type Variants } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  LogOut, Ticket, Wallet, User as UserIcon, Mail, Shield, 
  Hash, Activity, ArrowRight, Sparkles, CalendarDays 
} from 'lucide-react';

// --- Next-Gen Hover Card ---
function GlassCard({ children, className, style }: { children: React.ReactNode; className?: string, style?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [2, -2]), { stiffness: 400, damping: 40 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-2, 2]), { stiffness: 400, damping: 40 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1200, ...style }}
      className={`relative rounded-[2rem] bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

// --- Animation Variants ---
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ registered: 0, wallet: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      api.get('/api/events'),
      api.get(`/api/wallet/${user.id}/balance`),
    ]).then(async ([eventsRes, walletRes]) => {
      const events = eventsRes.data;
      let regCount = 0;
      await Promise.all(events.map(async (e: any) => {
        try {
          const res = await api.get(`/api/events/${e.id}/status?userId=${user.id}`);
          if (res.data.registered) regCount++;
        } catch {}
      }));
      setStats({ registered: regCount, wallet: walletRes.data.balance });
    }).catch(() => {}).finally(() => setLoadingStats(false));
  }, [user?.id]);

  if (!user) return null;

  const getInitials = (name: string) => name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleConfig = (role: string) => {
    if (role === 'ADMIN') return { label: 'System Admin', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    if (role === 'EVENT_ADMIN') return { label: 'Event Admin', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' };
    return { label: 'Student', icon: UserIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  };

  const roleInfo = getRoleConfig(user.role);
  const RoleIcon = roleInfo.icon;

  // Visual mock data for "Huge Realism Boost"
  const recentActivity = [
    { id: 1, action: 'Registered for an event', time: 'Just now', icon: Ticket, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { id: 2, action: 'Wallet Top-up Successful', time: '2 days ago', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 3, action: 'Joined Eventara Platform', time: '1 week ago', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      <Navbar />
      
      {/* Deep Space Ambient Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20 relative z-10">
        
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          
          {/* Header */}
          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-[2px] w-8 bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Account</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">My Profile</h1>
          </motion.div>

          {/* 1. PREMIUM HERO CARD */}
          <motion.div variants={fadeUp} className="mb-8">
            <GlassCard className="overflow-hidden">
              {/* Cover Banner */}
              <div className="h-32 md:h-40 w-full bg-gradient-to-r from-violet-600/20 via-cyan-600/20 to-emerald-600/20 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
              </div>

              {/* Avatar & Info */}
              <div className="px-6 md:px-10 pb-8 relative">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-20 mb-6">
                  
                  {/* Avatar */}
                  <div className="relative">
                    {(user as any).picture ? (
                      <img src={(user as any).picture} alt={user.name} className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-[#030305] object-cover shadow-2xl relative z-10 bg-[#0a0a0f]" />
                    ) : (
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-[#030305] bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-2xl relative z-10">
                        {getInitials(user.name)}
                      </div>
                    )}
                    {/* Glow behind avatar */}
                    <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-20 rounded-full" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button onClick={() => router.push('/dashboard/wallet')} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors flex items-center gap-2">
                      <Wallet size={16} /> Wallet
                    </button>
                    <button onClick={() => { logout(); router.push('/'); }} className="px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-colors flex items-center gap-2">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-1">{user.name}</h2>
                  <p className="text-slate-400 font-medium mb-4">{user.email}</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${roleInfo.bg} ${roleInfo.border} ${roleInfo.color} text-xs font-bold uppercase tracking-wider backdrop-blur-md`}>
                    <RoleIcon size={14} /> {roleInfo.label}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* 2. REDESIGNED STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div variants={fadeUp} onClick={() => router.push('/dashboard/registrations')} className="group cursor-pointer">
              <GlassCard className="p-8 hover:bg-white/[0.04] transition-colors border-l-4 border-l-cyan-400 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20 text-cyan-400">
                    <Ticket size={24} />
                  </div>
                  <ArrowRight size={20} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <div className="text-4xl font-black text-white tracking-tighter mb-1">
                    {loadingStats ? <span className="animate-pulse">--</span> : stats.registered}
                  </div>
                  <div className="text-sm font-bold uppercase tracking-widest text-slate-500">Events Joined</div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp} onClick={() => router.push('/dashboard/wallet')} className="group cursor-pointer">
              <GlassCard className="p-8 hover:bg-white/[0.04] transition-colors border-l-4 border-l-emerald-400 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center border border-emerald-400/20 text-emerald-400">
                    <Wallet size={24} />
                  </div>
                  <ArrowRight size={20} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <div className="text-4xl font-black text-white tracking-tighter mb-1">
                    {loadingStats ? <span className="animate-pulse">--</span> : `₹${stats.wallet.toFixed(0)}`}
                  </div>
                  <div className="text-sm font-bold uppercase tracking-widest text-slate-500">Wallet Balance</div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* 3 & 4. SPACING HIERARCHY: ACCOUNT DETAILS & RECENT ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Account Details */}
            <motion.div variants={fadeUp}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <UserIcon size={16} /> Identity Details
              </h3>
              <GlassCard className="divide-y divide-white/5">
                {[
                  { icon: UserIcon, label: 'Full Name', value: user.name },
                  { icon: Mail, label: 'Email Address', value: user.email },
                  { icon: Shield, label: 'Account Privilege', value: roleInfo.label, color: roleInfo.color },
                  { icon: Hash, label: 'System ID', value: `#${user.id}`, mono: true },
                ].map(({ icon: Icon, label, value, color, mono }) => (
                  <div key={label} className="p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-400/10 transition-colors border border-white/5">
                        <Icon size={18} />
                      </div>
                      <span className="text-sm font-medium text-slate-400">{label}</span>
                    </div>
                    <span className={`text-sm font-bold ${color ? color : 'text-white'} ${mono ? 'font-mono text-cyan-400' : ''}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </GlassCard>
            </motion.div>

            {/* Right: Recent Activity (Visual Realism) */}
            <motion.div variants={fadeUp}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Activity size={16} /> Recent Activity
              </h3>
              <GlassCard className="p-6">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        
                        {/* Timeline Icon */}
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full border border-[#0a0a0f] bg-[#0a0a0f] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                          <div className={`w-full h-full rounded-full flex items-center justify-center ${activity.bg} ${activity.color} border border-current/20`}>
                            <Icon size={14} />
                          </div>
                        </div>

                        {/* Content Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white text-sm">{activity.action}</span>
                          </div>
                          <time className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <CalendarDays size={12} /> {activity.time}
                          </time>
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>

          </div>

        </motion.div>
      </main>
    </div>
  );
}