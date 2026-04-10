'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Event {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  entryFee: number;
  status: string;
}

interface Participant {
  id: number;
  name: string;
  email: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const evtRes = await api.get(`/api/events/${id}`);
        setEvent(evtRes.data);

        if (user?.id) {
          const regRes = await api.get(`/api/events/${id}/participants`);
          setParticipants(regRes.data);
          setIsRegistered(regRes.data.some((p: Participant) => p.id === user.id));
        }
      } catch {
        toast.error('Failed to load event.');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user?.id) {
      toast.error('Please log in to register.');
      return;
    }

    setRegistering(true);
    try {
      if (isRegistered) {
        await api.delete(`/api/events/${id}/register`, { data: { userId: user.id } });
        setIsRegistered(false);
        setParticipants((p) => p.filter((x) => x.id !== user.id));
        toast.success('Registration cancelled.');
      } else {
        await api.post(`/api/events/${id}/register`, { userId: user.id });
        setIsRegistered(true);
        toast.success("You're in! 🎉");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message ?? 'Action failed.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <div className="detail-loading">Loading event...</div>;
  }

  if (!event) return null;

  const spotsLeft = event.maxParticipants - participants.length;
  const fillPercent = Math.min(100, (participants.length / event.maxParticipants) * 100);
  const statusColorMap: Record<string, string> = {
    UPCOMING: '#3fb950',
    ONGOING: '#58a6ff',
    EXPIRED: '#8b949e',
  };
  const statusColor = statusColorMap[event.status] ?? '#8b949e';

  return (
    <motion.div
      className="detail-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button className="back-btn" onClick={() => router.back()}>
        ← Back
      </button>

      <div className="detail-card">
        <div className="detail-top">
          <span
            className="status-badge"
            style={{
              color: statusColor,
              borderColor: statusColor + '40',
              background: statusColor + '12',
            }}
          >
            {event.status}
          </span>
          <h1 className="event-title">{event.title}</h1>
          <p className="event-desc">{event.description}</p>
        </div>

        <div className="detail-grid">
          {[
            {
              icon: '📅',
              label: 'Date',
              value: new Date(event.eventDate).toLocaleDateString('en-IN', {
                dateStyle: 'long',
              }),
            },
            { icon: '⏰', label: 'Time', value: `${event.startTime} – ${event.endTime}` },
            { icon: '📍', label: 'Location', value: event.location },
            {
              icon: '💰',
              label: 'Entry Fee',
              value: event.entryFee === 0 ? 'Free' : `₹${event.entryFee}`,
            },
            {
              icon: '👥',
              label: 'Capacity',
              value: `${participants.length} / ${event.maxParticipants}`,
            },
            {
              icon: '🎟️',
              label: 'Spots Left',
              value: spotsLeft > 0 ? `${spotsLeft} remaining` : 'Full',
            },
          ].map(({ icon, label, value }) => (
            <div className="info-tile" key={label}>
              <span className="tile-icon">{icon}</span>
              <div>
                <div className="tile-label">{label}</div>
                <div className="tile-value">{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="capacity-bar-wrap">
          <div className="capacity-bar-label">
            <span>Capacity</span>
            <span>{Math.round(fillPercent)}% full</span>
          </div>
          <div className="capacity-track">
            <motion.div
              className="capacity-fill"
              initial={{ width: 0 }}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ background: fillPercent > 80 ? '#f85149' : 'var(--blue)' }}
            />
          </div>
        </div>

        {user && event.status !== 'EXPIRED' && (
          <button
            className={`register-btn ${isRegistered ? 'cancel' : 'register'}`}
            onClick={handleRegister}
            disabled={registering || (!isRegistered && spotsLeft === 0)}
          >
            {registering
              ? 'Processing...'
              : isRegistered
              ? 'Cancel Registration'
              : spotsLeft === 0
              ? 'Event Full'
              : 'Register Now'}
          </button>
        )}
      </div>

      <style jsx>{`
        .detail-page {
          max-width: 680px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .back-btn {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          margin-bottom: 20px;
          display: block;
          transition: color 0.2s;
        }
        .back-btn:hover {
          color: var(--text);
        }
        .detail-loading {
          text-align: center;
          padding: 80px;
          color: var(--muted);
        }
        .detail-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }
        .detail-top {
          padding: 28px 28px 20px;
          border-bottom: 1px solid var(--border);
        }
        .status-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid;
          margin-bottom: 14px;
        }
        .event-title {
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 10px;
        }
        .event-desc {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border-bottom: 1px solid var(--border);
        }
        .info-tile {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 20px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .info-tile:nth-child(even) {
          border-right: none;
        }
        .info-tile:nth-last-child(-n + 2) {
          border-bottom: none;
        }
        .tile-icon {
          font-size: 18px;
          margin-top: 2px;
        }
        .tile-label {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .tile-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }
        .capacity-bar-wrap {
          padding: 20px 28px;
          border-bottom: 1px solid var(--border);
        }
        .capacity-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .capacity-track {
          height: 6px;
          background: var(--surface2);
          border-radius: 4px;
          overflow: hidden;
        }
        .capacity-fill {
          height: 100%;
          border-radius: 4px;
        }
        .register-btn {
          display: block;
          width: calc(100% - 56px);
          margin: 20px 28px;
          padding: 13px;
          border-radius: 10px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .register-btn.register {
          background: var(--blue);
          color: #fff;
        }
        .register-btn.register:hover {
          opacity: 0.85;
        }
        .register-btn.cancel {
          background: #f8514910;
          color: #f85149;
          border: 1px solid #f8514940;
        }
        .register-btn.cancel:hover {
          background: #f8514920;
        }
        .register-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>
    </motion.div>
  );
}