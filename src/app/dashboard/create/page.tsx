'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function CreateEvent() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', eventDate: '',
    startTime: '', endTime: '', location: '',
    maxParticipants: '', entryFee: '0',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user || (user.role !== 'event_admin' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#060910] flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <p className="text-white font-black text-2xl mb-2">Access Denied</p>
          <p className="text-[#8b949e]">Only Event Admins can create events.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/api/events', {
        ...form,
        eventDate: form.eventDate + ':00',
        startTime: form.startTime ? form.startTime + ':00' : null,
        endTime: form.endTime ? form.endTime + ':00' : null,
        organizerId: String(user.id),
      });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.error || 'Failed'));
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-[#060910]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#58a6ff] text-sm font-bold uppercase tracking-widest mb-2">— New Event</p>
          <h1 className="text-4xl font-black text-white mb-8">Create Event</h1>

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-400/10 border border-green-400/30 rounded-2xl p-4 text-green-400 mb-6 font-bold"
            >
              ✅ Event created! Redirecting...
            </motion.div>
          )}

          <div className="bg-[#0d1117] border border-[#30363d] rounded-3xl p-8 space-y-5">
            <Field label="Event Title">
              <input type="text" placeholder="Tech Fest 2026" value={form.title}
                onChange={e => update('title', e.target.value)} className="input-style" />
            </Field>
            <Field label="Description">
              <textarea placeholder="Describe your event..." value={form.description}
                onChange={e => update('description', e.target.value)}
                className="input-style min-h-[80px] resize-none" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Event Date">
                <input type="datetime-local" value={form.eventDate}
                  onChange={e => update('eventDate', e.target.value)} className="input-style" />
              </Field>
              <Field label="Max Participants">
                <input type="number" placeholder="50" value={form.maxParticipants}
                  onChange={e => update('maxParticipants', e.target.value)} className="input-style" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Time">
                <input type="datetime-local" value={form.startTime}
                  onChange={e => update('startTime', e.target.value)} className="input-style" />
              </Field>
              <Field label="End Time">
                <input type="datetime-local" value={form.endTime}
                  onChange={e => update('endTime', e.target.value)} className="input-style" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Location">
                <input type="text" placeholder="BMS College, Bengaluru" value={form.location}
                  onChange={e => update('location', e.target.value)} className="input-style" />
              </Field>
              <Field label="Entry Fee (₹)">
                <input type="number" placeholder="0 for free" value={form.entryFee}
                  onChange={e => update('entryFee', e.target.value)} className="input-style" />
              </Field>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading || success}
              className="w-full bg-[#58a6ff] hover:bg-[#79b8ff] disabled:opacity-50 text-[#060910] font-black rounded-2xl py-4 transition-colors text-lg"
            >
              {loading ? 'Creating...' : 'Create Event →'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-2">{label}</label>
      {children}
    </div>
  );
}