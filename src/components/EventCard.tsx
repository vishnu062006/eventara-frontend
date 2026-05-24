'use client';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { fireConfetti } from '@/lib/confetti';

interface Event {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  maxParticipants: number;
  entryFee: number;
  status: 'UPCOMING' | 'ONGOING' | 'EXPIRED';
  organizer: { id: number; name: string };
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Started'); clearInterval(timer); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}

export default function EventCard({ event, onRefresh }: { event: Event; onRefresh: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checking, setChecking] = useState(true);
  const countdown = useCountdown(event.eventDate);

  useEffect(() => {
    if (!user?.id) { setChecking(false); return; }
    api.get(`/api/events/${event.id}/status?userId=${user.id}`)
      .then(res => setIsRegistered(res.data.registered))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [event.id, user?.id]);

  const statusColors = {
    UPCOMING: 'bg-green-400/10 text-green-400 border-green-400/20',
    ONGOING: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    EXPIRED: 'bg-red-400/10 text-red-400 border-red-400/20',
  };

  const handleRegister = async () => {
    if (!user?.id) { toast.error('Please login first!'); return; }
    // Paid event → go to payment page
    if (event.entryFee > 0) {
      router.push(`/dashboard/payment/${event.id}`);
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/events/${event.id}/register`, { userId: user.id });
      setIsRegistered(true);
      fireConfetti();
      toast.success("You're in! 🎉");
      onRefresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await api.delete(`/api/events/${event.id}/register`, { data: { userId: user.id } });
      setIsRegistered(false);
      toast.success('Registration cancelled. Refund processed.');
      onRefresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Could not cancel.');
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl p-6 flex flex-col gap-4 h-full border transition-colors"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(88,166,255,0.4)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColors[event.status]}`}>
          {event.status === 'UPCOMING' ? '🟢' : event.status === 'ONGOING' ? '🟡' : '🔴'} {event.status}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${event.entryFee > 0 ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-green-400/10 text-green-400 border-green-400/20'}`}>
          {event.entryFee > 0 ? `💰 ₹${event.entryFee}` : '🆓 Free'}
        </span>
      </div>

      <div>
        <h3 className="font-black text-lg mb-1" style={{ color: 'var(--text)' }}>{event.title}</h3>
        <p className="text-sm line-clamp-2" style={{ color: 'var(--muted)' }}>
          {event.description || 'No description provided.'}
        </p>
      </div>

      {event.status === 'UPCOMING' && (
        <div className="rounded-xl px-4 py-3 flex justify-between border"
          style={{ background: 'rgba(88,166,255,0.05)', borderColor: 'rgba(88,166,255,0.2)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>🚀 Starts in</span>
          <span className="font-black text-sm" style={{ color: 'var(--text)' }}>{countdown}</span>
        </div>
      )}

      <div className="space-y-1.5 flex-1">
        {[
          { icon: '📍', val: event.location },
          { icon: '👥', val: `Max ${event.maxParticipants}` },
          { icon: '👤', val: event.organizer.name },
        ].map(({ icon, val }) => (
          <div key={val} className="text-sm" style={{ color: 'var(--muted)' }}>{icon} {val}</div>
        ))}
      </div>

      <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        {!user ? (
          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>Login to register</p>
        ) : checking ? (
          <div className="h-9 rounded-xl animate-pulse" style={{ background: 'var(--surface2)' }} />
        ) : (
          <div className="flex gap-2">
            {event.status !== 'EXPIRED' && (
              isRegistered ? (
                <button onClick={handleCancel} disabled={loading}
                  className="flex-1 rounded-xl py-2 text-sm font-semibold border disabled:opacity-50 transition-all"
                  style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149', borderColor: 'rgba(248,81,73,0.3)' }}>
                  {loading ? '...' : '✓ Cancel Registration'}
                </button>
              ) : (
                <button onClick={handleRegister} disabled={loading}
                  className="flex-1 rounded-xl py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: 'var(--blue)' }}>
                  {loading ? '...' : event.entryFee > 0 ? `Pay ₹${event.entryFee} & Register` : 'Register'}
                </button>
              )
            )}
            <button onClick={() => router.push(`/dashboard/events/${event.id}`)}
              className="flex-1 rounded-xl py-2 text-sm font-semibold border transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              View →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}