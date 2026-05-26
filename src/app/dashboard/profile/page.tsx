'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

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

  const getInitials = (name: string) =>
    name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleConfig = (role: string) => {
    if (role === 'ADMIN') return { label: 'Overall Admin', icon: '👑', color: '#f0883e', bg: 'rgba(240,136,62,0.1)', border: 'rgba(240,136,62,0.25)' };
    if (role === 'EVENT_ADMIN') return { label: 'Event Admin', icon: '🎯', color: '#58a6ff', bg: 'rgba(88,166,255,0.1)', border: 'rgba(88,166,255,0.25)' };
    return { label: 'Student', icon: '🎓', color: '#3fb950', bg: 'rgba(63,185,80,0.1)', border: 'rgba(63,185,80,0.25)' };
  };

  const role = getRoleConfig(user.role);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--blue)' }}>— Account</p>
          <h1 className="text-4xl font-black mb-8" style={{ color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>My Profile</h1>

          {/* Profile card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}>

            {/* Top banner */}
            <div style={{ height: 80, background: 'linear-gradient(135deg, rgba(88,166,255,0.15) 0%, rgba(167,139,250,0.15) 100%)', borderBottom: '1px solid var(--border)' }} />

            {/* Avatar + info */}
            <div style={{ padding: '0 28px 28px', position: 'relative' }}>
              <div style={{ marginTop: -40, marginBottom: 16 }}>
                {(user as any).picture ? (
                  <motion.img
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    src={(user as any).picture}
                    alt={user.name}
                    style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--bg)', objectFit: 'cover' }}
                  />
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--bg)', background: 'linear-gradient(135deg,#58a6ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: '#060910' }}
                  >
                    {getInitials(user.name)}
                  </motion.div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>{user.name}</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>{user.email}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", color: role.color, background: role.bg, border: `1px solid ${role.border}` }}>
                    {role.icon} {role.label}
                  </span>
                </div>
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(248,81,73,0.25)', background: 'rgba(248,81,73,0.08)', color: '#f85149', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Events Registered', value: loadingStats ? '...' : stats.registered, icon: '🎫', color: '#58a6ff' },
              { label: 'Wallet Balance', value: loadingStats ? '...' : `₹${stats.wallet.toFixed(0)}`, icon: '💳', color: '#3fb950' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: stat.color, marginBottom: 2 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Account details */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', padding: '18px 20px 10px' }}>
              Account Details
            </div>
            {[
              { icon: '👤', label: 'Full Name', value: user.name },
              { icon: '📧', label: 'Email', value: user.email },
              { icon: '🎭', label: 'Role', value: `${role.icon} ${role.label}` },
              { icon: '🔑', label: 'User ID', value: `#${user.id}` },
            ].map(({ icon, label, value }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border)', transition: 'background 0.15s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{value}</span>
              </motion.div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            {[
              { icon: '🎫', label: 'My Registrations', href: '/dashboard/registrations' },
              { icon: '💳', label: 'Wallet', href: '/dashboard/wallet' },
            ].map(({ icon, label, href }) => (
              <motion.button
                key={href}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(href)}
                style={{ padding: '16px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}
              >
                <span style={{ fontSize: 20 }}>{icon}</span>
                {label}
              </motion.button>
            ))}
          </div>

        </motion.div>
      </div>
    </div>
  );
}