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
  imageUrl?: string;
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

const STATUS_CONFIG = {
  UPCOMING: { color: '#3fb950', bg: 'rgba(63,185,80,0.1)', border: 'rgba(63,185,80,0.25)', dot: true },
  ONGOING:  { color: '#f0883e', bg: 'rgba(240,136,62,0.1)', border: 'rgba(240,136,62,0.25)', dot: true },
  EXPIRED:  { color: '#8b949e', bg: 'rgba(139,148,158,0.1)', border: 'rgba(139,148,158,0.25)', dot: false },
};

export default function EventCard({ event, onRefresh }: { event: Event; onRefresh: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number>(0);
  const [checking, setChecking] = useState(true);
  const countdown = useCountdown(event.eventDate);
  const s = STATUS_CONFIG[event.status];

  useEffect(() => {
    if (!user?.id) { setChecking(false); return; }
    api.get(`/api/events/${event.id}/status?userId=${user.id}`)
      .then(res => {
        setIsRegistered(res.data.registered);
        setWaitlistPosition(res.data.waitlistPosition ?? 0);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [event.id, user?.id]);

  const handleRegister = async () => {
    if (!user?.id) { toast.error('Please login first!'); return; }
    if (event.entryFee > 0) { router.push(`/dashboard/payment/${event.id}`); return; }
    setLoading(true);
    try {
      const res = await api.post(`/api/events/${event.id}/register`, { userId: user.id });
      if (res.status === 202 && res.data.waitlisted) {
        const msg = res.data.message as string;
        const pos = msg.match(/#(\d+)/)?.[1];
        setWaitlistPosition(parseInt(pos ?? '1'));
        toast(`Added to waitlist at position #${pos} 🕐`, { icon: '⏳' });
      } else {
        setIsRegistered(true);
        fireConfetti();
        toast.success("You're in! 🎉");
      }
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

  const handleLeaveWaitlist = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await api.delete(`/api/events/${event.id}/waitlist`, { data: { userId: user.id } });
      setWaitlistPosition(0);
      toast.success('Removed from waitlist.');
      onRefresh();
    } catch {
      toast.error('Could not leave waitlist.');
    } finally { setLoading(false); }
  };

  const isOnWaitlist = waitlistPosition > 0;
  const isFree = !event.entryFee || event.entryFee === 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl flex flex-col h-full border overflow-hidden transition-all duration-300"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(88,166,255,0.35)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Image / Header */}
      <div className="relative overflow-hidden" style={{ height: 140 }}>
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            style={{ filter: event.status === 'EXPIRED' ? 'grayscale(0.6)' : 'none' }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, 
                hsl(${(event.id * 47) % 360}, 30%, 12%) 0%, 
                hsl(${(event.id * 47 + 60) % 360}, 25%, 18%) 100%)`,
            }}
          >
            <span style={{ fontSize: 40, opacity: 0.3 }}>◈</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,17,23,0.8) 0%, transparent 60%)' }} />

        {/* Status + Fee badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}`, backdropFilter: 'blur(8px)' }}
          >
            {s.dot && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: s.color, animation: 'pulse 2s infinite' }}
              />
            )}
            {event.status}
          </span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={isFree
              ? { color: '#3fb950', background: 'rgba(63,185,80,0.15)', border: '1px solid rgba(63,185,80,0.3)', backdropFilter: 'blur(8px)' }
              : { color: '#f0883e', background: 'rgba(240,136,62,0.15)', border: '1px solid rgba(240,136,62,0.3)', backdropFilter: 'blur(8px)' }
            }
          >
            {isFree ? 'Free' : `₹${event.entryFee}`}
          </span>
        </div>

        {/* Countdown on image */}
        {event.status === 'UPCOMING' && countdown && countdown !== 'Started' && (
          <div className="absolute bottom-3 right-3">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ color: 'var(--text)', background: 'rgba(6,9,16,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              ⏱ {countdown}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div>
          <h3 className="font-black text-base leading-tight mb-1" style={{ color: 'var(--text)' }}>
            {event.title}
          </h3>
          <p className="text-xs line-clamp-2" style={{ color: 'var(--muted)' }}>
            {event.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          {[
            { icon: '📍', val: event.location },
            { icon: '📅', val: new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { icon: '👤', val: event.organizer.name },
          ].map(({ icon, val }) => (
            <div key={val} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
              <span>{icon}</span>
              <span className="truncate">{val}</span>
            </div>
          ))}
        </div>

        {/* Waitlist badge */}
        {isOnWaitlist && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: 'rgba(240,136,62,0.08)', border: '1px solid rgba(240,136,62,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14 }}>⏳</span>
              <div>
                <p className="text-xs font-bold" style={{ color: '#f0883e' }}>On Waitlist</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Position #{waitlistPosition}</p>
              </div>
            </div>
            <button
              onClick={handleLeaveWaitlist}
              disabled={loading}
              className="text-xs font-bold px-2 py-1 rounded-lg transition-colors"
              style={{ color: '#f85149', background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)' }}
            >
              Leave
            </button>
          </motion.div>
        )}

        {/* Registered badge */}
        {isRegistered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)' }}
          >
            <span style={{ color: '#3fb950', fontSize: 14 }}>✓</span>
            <p className="text-xs font-bold" style={{ color: '#3fb950' }}>You're registered</p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t mt-auto" style={{ borderColor: 'var(--border)' }}>
          {!user ? (
            <p className="text-xs text-center py-1" style={{ color: 'var(--muted)' }}>Login to register</p>
          ) : checking ? (
            <div className="h-9 rounded-xl animate-pulse" style={{ background: 'var(--surface2)' }} />
          ) : (
            <div className="flex gap-2">
              {event.status !== 'EXPIRED' && !isOnWaitlist && (
                isRegistered ? (
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 rounded-xl py-2 text-xs font-bold border disabled:opacity-50 transition-all"
                    style={{ background: 'rgba(248,81,73,0.08)', color: '#f85149', borderColor: 'rgba(248,81,73,0.25)' }}
                  >
                    {loading ? '...' : 'Cancel'}
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="flex-1 rounded-xl py-2 text-xs font-bold disabled:opacity-50 transition-all"
                    style={{ background: 'var(--blue)', color: '#060910' }}
                  >
                    {loading ? '...' : isFree ? 'Register' : `Pay ₹${event.entryFee}`}
                  </button>
                )
              )}
              <button
                onClick={() => router.push(`/dashboard/events/${event.id}`)}
                className="flex-1 rounded-xl py-2 text-xs font-bold border transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(88,166,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                View →
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}