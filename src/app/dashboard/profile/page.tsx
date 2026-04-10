'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return '👑 Overall Admin';
    if (role === 'event_admin') return '🎯 Event Admin';
    return '🎓 Student';
  };

  return (
    <div className="min-h-screen bg-[#060910]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#58a6ff] text-sm font-bold uppercase tracking-widest mb-2">— Account</p>
          <h1 className="text-4xl font-black text-white mb-8">My Profile</h1>

          <div className="bg-[#0d1117] border border-[#30363d] rounded-3xl p-8">
            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#30363d]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#d2a8ff] flex items-center justify-center text-[#060910] text-2xl font-black">
                {getInitials(user.name)}
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">{user.name}</h2>
                <p className="text-[#8b949e] mb-2">{user.email}</p>
                <span className="text-xs font-bold text-[#58a6ff] bg-[#58a6ff]/10 border border-[#58a6ff]/20 px-3 py-1 rounded-full">
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1">
              {[
                { label: 'Full Name', value: user.name, icon: '👤' },
                { label: 'Email', value: user.email, icon: '📧' },
                { label: 'Role', value: getRoleLabel(user.role), icon: '🎭' },
                { label: 'User ID', value: `#${user.id}`, icon: '🔑' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#30363d]/50 last:border-0">
                  <div className="flex items-center gap-3 text-[#8b949e] text-sm">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-white text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}