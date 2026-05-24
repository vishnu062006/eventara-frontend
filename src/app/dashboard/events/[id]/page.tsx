'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { fireConfetti } from '@/lib/confetti';

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
  organizer?: { id: number; name: string };
  imageUrl?: string;
}

interface Participant {
  id: number;
  name: string;
  email: string;
}

function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, started: false });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTime({ d: 0, h: 0, m: 0, s: 0, started: true }); return; }
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        started: false,
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return time;
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

  const countdown = useCountdown(event?.eventDate ?? '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const evtRes = await api.get(`/api/events/${id}`);
        setEvent(evtRes.data);
        if (user?.id) {
          const [regRes, statusRes] = await Promise.all([
            api.get(`/api/events/${id}/participants`),
            api.get(`/api/events/${id}/status?userId=${user.id}`),
          ]);
          setParticipants(regRes.data);
          setIsRegistered(statusRes.data.registered);
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
    if (!user?.id) { toast.error('Please log in first.'); return; }
    if (event?.entryFee && event.entryFee > 0) {
      router.push(`/dashboard/payment/${id}`);
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
        fireConfetti();
        toast.success("You're in! 🎉");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Action failed.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Loading event
        </motion.div>
      </div>
    );
  }

  if (!event) return null;

  const spotsLeft = event.maxParticipants - participants.length;
  const fillPercent = Math.min(100, (participants.length / event.maxParticipants) * 100);

  const statusMap: Record<string, { color: string; bg: string; label: string; dot: string }> = {
    UPCOMING: { color: '#3fb950', bg: 'rgba(63,185,80,0.08)', label: 'Upcoming', dot: '#3fb950' },
    ONGOING:  { color: '#58a6ff', bg: 'rgba(88,166,255,0.08)', label: 'Ongoing', dot: '#58a6ff' },
    EXPIRED:  { color: '#8b949e', bg: 'rgba(139,148,158,0.08)', label: 'Ended', dot: '#8b949e' },
  };
  const s = statusMap[event.status] ?? statusMap.EXPIRED;

  const isFree = !event.entryFee || event.entryFee === 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

        .detail-wrap {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: var(--bg);
          padding-top: 80px;
        }

        .detail-hero {
          position: relative;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 40px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--muted);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 32px;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .back-btn:hover {
          color: var(--text);
          border-color: rgba(88,166,255,0.3);
          background: var(--surface2);
        }

        .hero-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: 'Syne', sans-serif;
          flex-shrink: 0;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .fee-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
        }

        .event-title-large {
          font-family: 'Syne', sans-serif;
          font-size: clamp(28px, 5vw, 44px);
          font-weight: 800;
          color: var(--text);
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 16px;
        }

        .event-desc-large {
          font-size: 16px;
          line-height: 1.7;
          color: var(--muted);
          max-width: 640px;
          margin: 0 0 32px;
          font-weight: 300;
        }

        .main-grid {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 60px;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 720px) {
          .main-grid { grid-template-columns: 1fr; }
        }

        .info-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }

        .info-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          padding: 20px 20px 12px;
        }

        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-top: 1px solid var(--border);
          transition: background 0.15s;
        }
        .info-row:hover { background: var(--surface2); }

        .info-row-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .info-row-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .info-row-label {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 1px;
        }
        .info-row-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }
        .info-row-right {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          text-align: right;
        }

        .capacity-section {
          padding: 16px 20px;
          border-top: 1px solid var(--border);
        }
        .capacity-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 12px;
          color: var(--muted);
        }
        .capacity-numbers {
          font-size: 20px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 10px;
        }
        .capacity-track {
          height: 4px;
          background: var(--surface2);
          border-radius: 4px;
          overflow: hidden;
        }
        .capacity-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.8s ease;
        }

        .countdown-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .countdown-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(88,166,255,0.04), rgba(167,139,250,0.04));
          pointer-events: none;
        }
        .countdown-unit {
          text-align: center;
          padding: 12px 8px;
          background: var(--surface2);
          border-radius: 10px;
          border: 1px solid var(--border);
        }
        .countdown-num {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .countdown-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 4px;
        }

        .action-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          position: sticky;
          top: 80px;
        }
        .action-top {
          padding: 20px;
          border-bottom: 1px solid var(--border);
        }
        .action-price {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
          margin-bottom: 4px;
        }
        .action-price-sub {
          font-size: 12px;
          color: var(--muted);
        }
        .action-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }

        .reg-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .reg-btn.primary {
          background: linear-gradient(135deg, #58a6ff, #a78bfa);
          color: #060910;
          box-shadow: 0 4px 20px rgba(88,166,255,0.25);
        }
        .reg-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(88,166,255,0.35);
        }
        .reg-btn.cancel-btn {
          background: rgba(248,81,73,0.08);
          color: #f85149;
          border: 1px solid rgba(248,81,73,0.25);
        }
        .reg-btn.cancel-btn:hover {
          background: rgba(248,81,73,0.14);
        }
        .reg-btn.disabled-btn {
          background: var(--surface2);
          color: var(--muted);
          cursor: not-allowed;
        }
        .reg-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

        .action-note {
          font-size: 11px;
          color: var(--muted);
          text-align: center;
          line-height: 1.5;
        }

        .registered-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: 10px;
          background: rgba(63,185,80,0.08);
          border: 1px solid rgba(63,185,80,0.2);
          font-size: 12px;
          font-weight: 600;
          color: #3fb950;
          font-family: 'Syne', sans-serif;
        }

        .divider {
          height: 1px;
          background: var(--border);
        }

        .organizer-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
        }
        .org-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #58a6ff, #a78bfa);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #060910;
          flex-shrink: 0;
        }
        .org-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .org-label { font-size: 11px; color: var(--muted); }
      `}</style>

      <div className="detail-wrap">
        <div className="detail-hero">
          <motion.button
            className="back-btn"
            onClick={() => router.back()}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            ← Back
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="hero-header">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="status-pill" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}>
                  <span className="status-dot" style={{ background: s.dot }} />
                  {s.label}
                </span>
                <span className="fee-pill" style={isFree
                  ? { color: '#3fb950', background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)' }
                  : { color: '#f0883e', background: 'rgba(240,136,62,0.08)', border: '1px solid rgba(240,136,62,0.2)' }
                }>
                  {isFree ? '🆓 Free' : `💰 ₹${event.entryFee}`}
                </span>
              </div>
            </div>

            <h1 className="event-title-large">{event.title}</h1>
            {event.description && (
              <p className="event-desc-large">{event.description}</p>
            )}
          </motion.div>
        </div>

        <div className="main-grid">
          {/* Left column */}
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {/* Countdown */}
            {event.status === 'UPCOMING' && !countdown.started && (
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                  Starts in
                </div>
                <div className="countdown-card">
                  {[
                    { val: countdown.d, label: 'Days' },
                    { val: countdown.h, label: 'Hours' },
                    { val: countdown.m, label: 'Mins' },
                    { val: countdown.s, label: 'Secs' },
                  ].map(({ val, label }) => (
                    <div className="countdown-unit" key={label}>
                      <div className="countdown-num">{String(val).padStart(2, '0')}</div>
                      <div className="countdown-label">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Details */}
            <div className="info-card">
              <div className="info-section-title">Event Details</div>
              {[
                { icon: '📅', label: 'Date', value: new Date(event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
                { icon: '⏰', label: 'Time', value: event.startTime && event.endTime ? `${event.startTime} – ${event.endTime}` : 'TBA' },
                { icon: '📍', label: 'Location', value: event.location },
              ].map(({ icon, label, value }) => (
                <div className="info-row" key={label}>
                  <div className="info-row-left">
                    <div className="info-row-icon">{icon}</div>
                    <div>
                      <div className="info-row-label">{label}</div>
                      <div className="info-row-value">{value}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Capacity */}
              <div className="capacity-section">
                <div className="capacity-header">
                  <span>Capacity</span>
                  <span style={{ color: spotsLeft === 0 ? '#f85149' : 'var(--muted)' }}>
                    {spotsLeft === 0 ? 'Full' : `${spotsLeft} spots left`}
                  </span>
                </div>
                <div className="capacity-numbers">
                  {participants.length}
                  <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 18 }}> / {event.maxParticipants}</span>
                </div>
                <div className="capacity-track">
                  <motion.div
                    className="capacity-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercent}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                    style={{ background: fillPercent > 85 ? 'linear-gradient(90deg,#f85149,#ff6b6b)' : 'linear-gradient(90deg,#58a6ff,#a78bfa)' }}
                  />
                </div>
              </div>

              {/* Organizer */}
              {event.organizer && (
                <>
                  <div className="divider" />
                  <div className="organizer-row">
                    <div className="org-avatar">
                      {event.organizer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="org-name">{event.organizer.name}</div>
                      <div className="org-label">Organizer</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Right column — sticky action card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="action-card">
              <div className="action-top">
                <div className="action-price">
                  {isFree ? 'Free' : `₹${event.entryFee}`}
                </div>
                <div className="action-price-sub">
                  {isFree ? 'No entry fee' : 'Entry fee per person'}
                </div>
              </div>

              <div className="action-body">
                {isRegistered && (
                  <div className="registered-badge">
                    ✓ You're registered
                  </div>
                )}

                {user && event.status !== 'EXPIRED' ? (
                  <>
                    {isRegistered ? (
                      <button
                        className="reg-btn cancel-btn"
                        onClick={handleRegister}
                        disabled={registering}
                      >
                        {registering ? 'Cancelling...' : 'Cancel Registration'}
                      </button>
                    ) : spotsLeft === 0 ? (
                      <button className="reg-btn disabled-btn" disabled>
                        Event Full — Join Waitlist
                      </button>
                    ) : (
                      <button
                        className="reg-btn primary"
                        onClick={handleRegister}
                        disabled={registering}
                      >
                        {registering
                          ? 'Processing...'
                          : isFree
                          ? 'Register Now'
                          : `Pay ₹${event.entryFee} & Register`}
                      </button>
                    )}

                    {isRegistered && event.entryFee > 0 && (
                      <p className="action-note">
                        95% refund on cancellation · 5% platform fee retained
                      </p>
                    )}
                  </>
                ) : event.status === 'EXPIRED' ? (
                  <button className="reg-btn disabled-btn" disabled>
                    Event Ended
                  </button>
                ) : (
                  <button className="reg-btn disabled-btn" disabled>
                    Login to Register
                  </button>
                )}

                <div className="divider" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '👥', label: `${participants.length} registered` },
                    { icon: '🎟️', label: spotsLeft > 0 ? `${spotsLeft} spots available` : 'No spots left' },
                    { icon: '📅', label: new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
                  ].map(({ icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}