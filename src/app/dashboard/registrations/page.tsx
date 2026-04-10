'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function MyRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      // Get all events and check participants for each
      const eventsRes = await api.get('/api/events');
      const events = eventsRes.data;
      
      const myRegs: any[] = [];
      for (const event of events) {
        try {
          const partRes = await api.get(`/api/events/${event.id}/participants`);
          const isRegistered = partRes.data.some((p: any) => p.user.id === user?.id);
          if (isRegistered) myRegs.push(event);
        } catch {}
      }
      setRegistrations(myRegs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (eventId: number) => {
    try {
      await api.delete(`/api/events/${eventId}/register`, { data: { userId: user?.id } });
      fetchRegistrations();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.error || 'Failed'));
    }
  };

  return (
    <div className="min-h-screen bg-[#060910]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#58a6ff] text-sm font-bold uppercase tracking-widest mb-2">— My Activity</p>
          <h1 className="text-4xl font-black text-white mb-8">My Registrations</h1>

          {loading ? (
            <div className="text-center py-20 text-[#8b949e]">Loading...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎫</div>
              <p className="text-white font-black text-xl mb-2">No registrations yet</p>
              <p className="text-[#8b949e]">Browse events and register for ones you like!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff]/40 rounded-2xl p-6 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        event.status === 'UPCOMING' ? 'bg-green-400/10 text-green-400' :
                        event.status === 'ONGOING' ? 'bg-yellow-400/10 text-yellow-400' :
                        'bg-red-400/10 text-red-400'
                      }`}>{event.status}</span>
                      {event.entryFee > 0 && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-400/10 text-yellow-400">
                          ₹{event.entryFee}
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-black text-lg">{event.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[#8b949e] text-sm">📅 {new Date(event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                      <span className="text-[#8b949e] text-sm">📍 {event.location}</span>
                    </div>
                  </div>
                  {event.status !== 'EXPIRED' && (
                    <button
                      onClick={() => handleCancel(event.id)}
                      className="bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 text-sm font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}