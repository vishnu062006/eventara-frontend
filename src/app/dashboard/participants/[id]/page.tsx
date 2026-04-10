'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function EventParticipants({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventRes, partRes] = await Promise.all([
        api.get(`/api/events/${params.id}`),
        api.get(`/api/events/${params.id}/participants`)
      ]);
      setEvent(eventRes.data);
      setParticipants(partRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const revenue = event ? (participants.length * (event.entryFee || 0)) : 0;

  return (
    <div className="min-h-screen bg-[#060910]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => router.back()}
            className="text-[#8b949e] hover:text-white text-sm font-bold mb-6 flex items-center gap-2 transition-colors"
          >
            ← Back
          </button>

          <p className="text-[#58a6ff] text-sm font-bold uppercase tracking-widest mb-2">— Participants</p>
          <h1 className="text-4xl font-black text-white mb-2">{event?.title}</h1>
          <p className="text-[#8b949e] mb-8">{event?.location} · {event && new Date(event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Registered', value: participants.length, color: 'text-[#58a6ff]' },
              { label: 'Capacity', value: event?.maxParticipants || 0, color: 'text-white' },
              { label: 'Revenue', value: `₹${revenue}`, color: 'text-yellow-400' },
            ].map((stat, i) => (
              <div key={stat.label} className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-5">
                <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[#8b949e] text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-5 mb-6">
            <div className="flex justify-between text-sm text-[#8b949e] mb-2">
              <span>Capacity filled</span>
              <span className="text-white font-bold">{Math.round((participants.length / (event?.maxParticipants || 1)) * 100)}%</span>
            </div>
            <div className="bg-[#21262d] rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((participants.length / (event?.maxParticipants || 1)) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-gradient-to-r from-[#58a6ff] to-[#d2a8ff] h-3 rounded-full"
              />
            </div>
          </div>

          {/* Participants list */}
          {loading ? (
            <div className="text-center py-20 text-[#8b949e]">Loading...</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-white font-black text-xl">No participants yet</p>
            </div>
          ) : (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
                <h2 className="text-white font-black">Participants ({participants.length})</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#30363d]">
                    {['#', 'Name', 'Email', 'Role', 'Registered At'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-[#8b949e] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#30363d]/50 hover:bg-[#21262d]/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-[#8b949e] text-sm">{i + 1}</td>
                      <td className="px-6 py-4 text-white font-bold text-sm">{p.user.name}</td>
                      <td className="px-6 py-4 text-[#8b949e] text-sm">{p.user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          p.user.role === 'admin' ? 'bg-purple-400/10 text-purple-400' :
                          p.user.role === 'event_admin' ? 'bg-blue-400/10 text-blue-400' :
                          'bg-green-400/10 text-green-400'
                        }`}>{p.user.role}</span>
                      </td>
                      <td className="px-6 py-4 text-[#8b949e] text-sm">
                        {new Date(p.registeredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}