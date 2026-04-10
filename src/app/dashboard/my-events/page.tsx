'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import EditEventModal from '@/components/EditEventModal';
import api from '@/lib/api';

export default function MyEvents() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<{ [key: number]: any[] }>({});
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'event_admin' && user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
    fetchMyEvents();
  }, [user]);

  const fetchMyEvents = async () => {
    try {
      const res = await api.get('/api/events');
      const myEvents = res.data.filter((e: any) => e.organizer.id === user?.id);
      setEvents(myEvents);

      const partData: { [key: number]: any[] } = {};
      for (const event of myEvents) {
        try {
          const pRes = await api.get(`/api/events/${event.id}/participants`);
          partData[event.id] = pRes.data;
        } catch {
          partData[event.id] = [];
        }
      }
      setParticipants(partData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/api/events/${eventId}`);
      fetchMyEvents();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.error || 'Failed'));
    }
  };

  const totalRevenue = events.reduce((acc, e) => {
    const count = participants[e.id]?.length || 0;
    return acc + (e.entryFee * count);
  }, 0);

  return (
    <div className="min-h-screen bg-[#060910]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          {/* Header */}
          <p className="text-[#58a6ff] text-sm font-bold uppercase tracking-widest mb-2">
            — Event Management
          </p>
          <h1 className="text-4xl font-black text-white mb-8">My Events</h1>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Events', value: events.length, color: 'text-white' },
              { label: 'Total Registrations', value: Object.values(participants).reduce((a, p) => a + p.length, 0), color: 'text-[#58a6ff]' },
              { label: 'Total Revenue', value: `₹${totalRevenue}`, color: 'text-yellow-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-5"
              >
                <div className={`text-3xl font-black ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-[#8b949e] text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Create button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => router.push('/dashboard/create')}
              className="bg-[#58a6ff] hover:bg-[#79b8ff] text-[#060910] font-black px-6 py-3 rounded-xl transition-colors"
            >
              + Create Event
            </button>
          </div>

          {/* Events */}
          {loading ? (
            <div className="text-center py-20 text-[#8b949e]">Loading...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-white font-black text-xl mb-2">No events yet</p>
              <p className="text-[#8b949e]">Create your first event!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    
                    {/* Left */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          event.status === 'UPCOMING'
                            ? 'bg-green-400/10 text-green-400'
                            : event.status === 'ONGOING'
                            ? 'bg-yellow-400/10 text-yellow-400'
                            : 'bg-red-400/10 text-red-400'
                        }`}>
                          {event.status}
                        </span>
                        <span className="text-xs text-[#8b949e]">
                          ID: #{event.id}
                        </span>
                      </div>

                      <h3 className="text-white font-black text-xl mb-1">
                        {event.title}
                      </h3>

                      <p className="text-[#8b949e] text-sm mb-3">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-[#8b949e]">
                        <span>
                          📅 {new Date(event.eventDate).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span>📍 {event.location}</span>
                        <span>
                          👥 {participants[event.id]?.length || 0}/
                          {event.maxParticipants}
                        </span>
                        <span>
                          💰 {event.entryFee > 0 ? `₹${event.entryFee}` : 'Free'}
                        </span>
                      </div>
                    </div>

                    {/* Right buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/participants/${event.id}`)
                        }
                        className="bg-[#58a6ff]/10 hover:bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/20 text-sm font-bold px-4 py-2 rounded-xl"
                      >
                        View Participants
                      </button>

                      <button
                        onClick={() => setEditingEvent(event)}
                        className="bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 text-sm font-bold px-4 py-2 rounded-xl"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(event.id)}
                        className="bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 text-sm font-bold px-4 py-2 rounded-xl"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-[#8b949e] mb-1">
                      <span>Registration Progress</span>
                      <span>
                        {participants[event.id]?.length || 0}/
                        {event.maxParticipants}
                      </span>
                    </div>
                    <div className="bg-[#21262d] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#58a6ff] to-[#d2a8ff] h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((participants[event.id]?.length || 0) /
                              event.maxParticipants) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ✅ Edit Modal */}
      <EditEventModal
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onUpdated={(updated) => {
          setEvents((evts) =>
            evts.map((e) => (e.id === updated.id ? updated : e))
          );
        }}
      />
    </div>
  );
}