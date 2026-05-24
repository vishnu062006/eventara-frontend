'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function AdminPanel() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [reqLoading, setReqLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/access-requests');
      setRequests(res.data);
    } catch {} finally {
      setReqLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    await api.patch(`/api/access-requests/${id}/approve`);
    fetchRequests();
  };

  const handleReject = async (id: string) => {
    await api.patch(`/api/access-requests/${id}/reject`);
    fetchRequests();
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    api.get('/api/events').then(res => setEvents(res.data)).finally(() => setLoading(false));
    fetchRequests();
  }, [user]);

  const totalRevenue = events.reduce((acc, e) => acc + (e.entryFee || 0), 0);

  return (
    <div className="min-h-screen bg-[#060910]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#58a6ff] text-sm font-bold uppercase tracking-widest mb-2">— System Overview</p>
          <h1 className="text-4xl font-black text-white mb-8">Admin Panel</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Events', value: events.length, color: 'text-white', icon: '📅' },
              { label: 'Upcoming', value: events.filter(e => e.status === 'UPCOMING').length, color: 'text-green-400', icon: '🟢' },
              { label: 'Total Capacity', value: events.reduce((a, e) => a + e.maxParticipants, 0), color: 'text-[#58a6ff]', icon: '👥' },
              { label: 'Total Entry Fees', value: `₹${totalRevenue}`, color: 'text-yellow-400', icon: '💰' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-5"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[#8b949e] text-xs mt-1 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Access Requests */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-3xl overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-[#30363d] flex items-center justify-between">
              <h2 className="text-white font-black text-lg">Event Admin Requests</h2>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-400/10 text-yellow-400">
                {requests.filter(r => r.status === 'PENDING').length} Pending
              </span>
            </div>
            {reqLoading ? (
              <div className="p-8 text-center text-[#8b949e]">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-[#8b949e]">No requests yet.</div>
            ) : (
              <div className="divide-y divide-[#30363d]">
                {requests.map((req, i) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-white font-bold text-sm">{req.userName || `User #${req.userId}`}</p>
                      <p className="text-[#8b949e] text-xs mt-0.5">
                        {new Date(req.requestedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          req.status === 'APPROVED' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                        }`}>{req.status}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Events Table */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-[#30363d]">
              <h2 className="text-white font-black text-lg">All Events</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-[#8b949e]">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#30363d]">
                      {['Title', 'Organizer', 'Status', 'Capacity', 'Fee', 'Date'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-bold text-[#8b949e] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e, i) => (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-[#30363d]/50 hover:bg-[#21262d]/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-white font-bold text-sm">{e.title}</td>
                        <td className="px-6 py-4 text-[#8b949e] text-sm">{e.organizer.name}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            e.status === 'UPCOMING' ? 'bg-green-400/10 text-green-400' :
                            e.status === 'ONGOING' ? 'bg-yellow-400/10 text-yellow-400' :
                            'bg-red-400/10 text-red-400'
                          }`}>{e.status}</span>
                        </td>
                        <td className="px-6 py-4 text-[#8b949e] text-sm">{e.maxParticipants}</td>
                        <td className="px-6 py-4 text-[#8b949e] text-sm">{e.entryFee > 0 ? `₹${e.entryFee}` : 'Free'}</td>
                        <td className="px-6 py-4 text-[#8b949e] text-sm">{new Date(e.eventDate).toLocaleDateString('en-IN')}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}