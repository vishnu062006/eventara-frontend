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

/* ================= COUNTDOWN ================= */
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Started');
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m`);
      else setTimeLeft(`${mins}m`);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

/* ================= COMPONENT ================= */
export default function EventCard({
  event,
  onRefresh,
}: {
  event: Event;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const countdown = useCountdown(event.eventDate);

  /* ===== Check if user is already registered ===== */
  useEffect(() => {
    const checkRegistration = async () => {
      if (!user?.id) {
        setCheckingStatus(false);
        return;
      }
      try {
        const res = await api.get(`/api/events/${event.id}/participants`);
        const participants: { id: number }[] = res.data;
        setIsRegistered(participants.some((p) => p.id === user.id));
      } catch {
        // silently fail — just default to not registered
      } finally {
        setCheckingStatus(false);
      }
    };
    checkRegistration();
  }, [event.id, user?.id]);

  const statusColors = {
    UPCOMING: 'bg-green-400/10 text-green-400 border-green-400/20',
    ONGOING: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    EXPIRED: 'bg-red-400/10 text-red-400 border-red-400/20',
  };

  /* ================= REGISTER ================= */
  const handleRegister = async () => {
    if (!user?.id) {
      toast.error('Please login first!');
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
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  /* ================= CANCEL ================= */
  const handleCancel = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      await api.delete(`/api/events/${event.id}/register`, {
        data: { userId: user.id },
      });
      setIsRegistered(false);
      toast.success('Registration cancelled.');
      onRefresh();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message ?? 'Could not cancel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl p-6 flex flex-col gap-4 h-full border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = 'rgba(88,166,255,0.4)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = 'var(--border)')
      }
    >
      {/* Top */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border ${
            statusColors[event.status]
          }`}
        >
          {event.status === 'UPCOMING'
            ? '🟢'
            : event.status === 'ONGOING'
            ? '🟡'
            : '🔴'}{' '}
          {event.status}
        </span>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border ${
            event.entryFee > 0
              ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
              : 'bg-green-400/10 text-green-400 border-green-400/20'
          }`}
        >
          {event.entryFee > 0 ? `💰 ₹${event.entryFee}` : '🆓 Free'}
        </span>
      </div>

      {/* Title */}
      <div>
        <h3
          className="font-black text-lg mb-1"
          style={{ color: 'var(--text)' }}
        >
          {event.title}
        </h3>
        <p className="text-sm line-clamp-2" style={{ color: 'var(--muted)' }}>
          {event.description || 'No description provided.'}
        </p>
      </div>

      {/* Countdown */}
      {event.status === 'UPCOMING' && (
        <div
          className="rounded-xl px-4 py-3 flex justify-between border"
          style={{
            background: 'rgba(88,166,255,0.05)',
            borderColor: 'rgba(88,166,255,0.2)',
          }}
        >
          <span className="text-xs font-bold">🚀 Starts in</span>
          <span className="font-black text-sm">{countdown}</span>
        </div>
      )}

      {/* Details */}
      <div className="space-y-1.5 flex-1">
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          📍 {event.location}
        </div>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          👥 Max {event.maxParticipants}
        </div>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          👤 {event.organizer.name}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        {!user ? (
          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
            Login to register
          </p>
        ) : checkingStatus ? (
          <div className="flex gap-2">
            <div className="flex-1 h-9 rounded-xl animate-pulse" style={{ background: 'var(--surface2)' }} />
            <div className="flex-1 h-9 rounded-xl animate-pulse" style={{ background: 'var(--surface2)' }} />
          </div>
        ) : (
          <div className="flex gap-2">
            {event.status !== 'EXPIRED' && (
              isRegistered ? (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 rounded-xl py-2 text-sm font-semibold border transition-opacity disabled:opacity-50"
                  style={{
                    background: 'rgba(248,81,73,0.1)',
                    color: '#f85149',
                    borderColor: 'rgba(248,81,73,0.3)',
                  }}
                >
                  {loading ? '...' : '✓ Registered — Cancel'}
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--blue)' }}
                >
                  {loading ? '...' : 'Register'}
                </button>
              )
            )}

            <button
              onClick={() => router.push(`/dashboard/events/${event.id}`)}
              className="flex-1 rounded-xl py-2 text-sm font-semibold border transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.borderColor = 'var(--muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              View →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}