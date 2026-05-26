'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [participantCount, setParticipantCount] = useState(0);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showQR, setShowQR] = useState(false);
const [qrDataUrl, setQrDataUrl] = useState('');
const [registrationId, setRegistrationId] = useState<number | null>(null);

  const countdown = useCountdown(event?.eventDate ?? '');

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const fetchData = async () => {
    try {
      const evtRes = await api.get(`/api/events/${id}`);
      setEvent(evtRes.data);

      const [partRes, waitRes] = await Promise.all([
        api.get(`/api/events/${id}/participants`),
        api.get(`/api/events/${id}/waitlist`),
      ]);
      setParticipantCount(partRes.data.length);
      setWaitlistCount(waitRes.data.length);

      if (user?.id) {
        const statusRes = await api.get(`/api/events/${id}/status?userId=${user.id}`);
        setIsRegistered(statusRes.data.registered);
        setWaitlistPosition(statusRes.data.waitlistPosition ?? 0);
      }
    } catch {
      toast.error('Failed to load event.');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, user]);

  const handleRegister = async () => {
    if (!user?.id) {
      toast.error('Please log in first.');
      return;
    }
  
    if (event?.entryFee && event.entryFee > 0) {
      router.push(`/dashboard/payment/${id}`);
      return;
    }
  
    setRegistering(true);
  
    try {
      if (isRegistered) {
        await api.delete(`/api/events/${id}/register`, {
          data: { userId: user.id },
        });
  
        setIsRegistered(false);
        setParticipantCount(c => c - 1);
        setShowQR(false);
        setQrDataUrl('');
        setRegistrationId(null);
  
        toast.success('Registration cancelled.');
      } else {
        const res = await api.post(`/api/events/${id}/register`, {
          userId: user.id,
        });
  
        if (res.status === 202 && res.data.waitlisted) {
          const msg = res.data.message as string;
          const pos = msg.match(/#(\d+)/)?.[1];
  
          setWaitlistPosition(parseInt(pos ?? '1'));
          setWaitlistCount(c => c + 1);
  
          toast(`Added to waitlist at position #${pos} 🕐`, {
            icon: '⏳',
          });
        } else {
          setIsRegistered(true);
          setParticipantCount(c => c + 1);
  
          if (res.data?.registrationId) {
            setRegistrationId(res.data.registrationId);
          }
  
          if (res.data?.qrCode) {
            setQrDataUrl(res.data.qrCode);
          }
  
          fireConfetti();
          toast.success("You're in! 🎉");
        }
      }
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
      };
  
      toast.error(e.response?.data?.message ?? 'Action failed.');
    } finally {
      setRegistering(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!user?.id) return;
    setRegistering(true);
    try {
      await api.delete(`/api/events/${id}/waitlist`, { data: { userId: user.id } });
      setWaitlistPosition(0);
      setWaitlistCount(c => c - 1);
      toast.success('Removed from waitlist.');
    } catch {
      toast.error('Could not leave waitlist.');
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
          style={{ fontSize: 14, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Loading event
        </motion.div>
      </div>
    );
  }

  if (!event) return null;

  const isOnWaitlist = waitlistPosition > 0;
  const spotsLeft = event.maxParticipants - participantCount;
  const fillPercent = Math.min(100, (participantCount / event.maxParticipants) * 100);
  const isFree = !event.entryFee || event.entryFee === 0;

  const statusMap: Record<string, { color: string; bg: string; label: string }> = {
    UPCOMING: { color: '#3fb950', bg: 'rgba(63,185,80,0.08)', label: 'Upcoming' },
    ONGOING:  { color: '#f0883e', bg: 'rgba(240,136,62,0.08)', label: 'Ongoing' },
    EXPIRED:  { color: '#8b949e', bg: 'rgba(139,148,158,0.08)', label: 'Ended' },
  };
  const s = statusMap[event.status] ?? statusMap.EXPIRED;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        .detail-wrap { font-family:'DM Sans',sans-serif; min-height:100vh; background:var(--bg); padding-top:80px; }
        .main-grid { max-width:960px; margin:0 auto; padding:0 24px 60px; display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
        @media(max-width:720px) { .main-grid { grid-template-columns:1fr; } }
        .info-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
        .action-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; position:sticky; top:80px; }
        .info-row { display:flex; align-items:center; padding:14px 20px; border-top:1px solid var(--border); gap:12px; transition:background 0.15s; }
        .info-row:hover { background:var(--surface2); }
        .info-icon { width:34px; height:34px; border-radius:8px; background:var(--surface2); display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
        .countdown-unit { text-align:center; padding:14px 8px; background:var(--surface2); border-radius:12px; border:1px solid var(--border); }
        .countdown-num { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:var(--text); line-height:1; letter-spacing:-0.02em; }
        .countdown-label { font-size:9px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-top:4px; }
        .reg-btn { width:100%; padding:14px; border-radius:12px; border:none; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .reg-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none !important; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
      `}</style>

      <div className="detail-wrap">
        {/* Hero Image */}
        <div style={{ position: 'relative', height: 280, overflow: 'hidden', marginBottom: 0 }}>
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(135deg, hsl(${(event.id * 47) % 360},25%,10%) 0%, hsl(${(event.id * 47 + 80) % 360},20%,16%) 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 80, opacity: 0.15, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: 'white' }}>
                {event.title.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg) 0%, rgba(6,9,16,0.4) 50%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Syne',sans-serif", color: s.color, background: s.bg, border: `1px solid ${s.color}30`, backdropFilter: 'blur(8px)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block', animation: event.status !== 'EXPIRED' ? 'pulse 2s infinite' : 'none' }} />
                {s.label}
              </span>
              <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: "'Syne',sans-serif", backdropFilter: 'blur(8px)', ...(isFree ? { color: '#3fb950', background: 'rgba(63,185,80,0.12)', border: '1px solid rgba(63,185,80,0.25)' } : { color: '#f0883e', background: 'rgba(240,136,62,0.12)', border: '1px solid rgba(240,136,62,0.25)' }) }}>
                {isFree ? 'Free Entry' : `₹${event.entryFee} Entry`}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
              {event.title}
            </h1>
          </div>
          <button
            onClick={() => router.back()}
            style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(6,9,16,0.5)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
          >
            ← Back
          </button>
        </div>

        <div className="main-grid" style={{ marginTop: 32 }}>
          {/* Left column */}
          <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

            {/* Description */}
            {event.description && (
              <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--muted)', margin: 0, fontWeight: 300 }}>
                {event.description}
              </p>
            )}

            {/* Countdown */}
            {event.status === 'UPCOMING' && !countdown.started && (
              <div>
                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Starts in</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, position: 'relative', padding: 16, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
                  {[{ val: countdown.d, label: 'Days' }, { val: countdown.h, label: 'Hours' }, { val: countdown.m, label: 'Mins' }, { val: countdown.s, label: 'Secs' }].map(({ val, label }) => (
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
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', padding: '18px 20px 10px' }}>Event Details</div>
              {[
                { icon: '📅', label: 'Date', value: new Date(event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
                { icon: '⏰', label: 'Time', value: event.startTime && event.endTime ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}` : 'To be announced' },
                { icon: '📍', label: 'Location', value: event.location },
              ].map(({ icon, label, value }) => (
                <div className="info-row" key={label}>
                  <div className="info-icon">{icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
                  </div>
                </div>
              ))}

              {/* Capacity bar */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Capacity</span>
                  <span style={{ color: spotsLeft === 0 ? '#f85149' : spotsLeft <= 5 ? '#f0883e' : 'var(--muted)', fontWeight: 600 }}>
                    {spotsLeft === 0 ? '🔴 Full' : spotsLeft <= 5 ? `⚠️ ${spotsLeft} left` : `${spotsLeft} spots left`}
                  </span>
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
                  {participantCount}<span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 16 }}> / {event.maxParticipants}</span>
                </div>
                <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercent}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                    style={{ height: '100%', borderRadius: 4, background: fillPercent > 85 ? 'linear-gradient(90deg,#f85149,#ff6b6b)' : 'linear-gradient(90deg,#58a6ff,#a78bfa)' }}
                  />
                </div>
              </div>

              {/* Waitlist count */}
              {waitlistCount > 0 && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="info-icon">⏳</div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Waitlist</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#f0883e' }}>{waitlistCount} people waiting</div>
                  </div>
                </div>
              )}

              {/* Organizer */}
              {event.organizer && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#58a6ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: '#060910', flexShrink: 0 }}>
                    {event.organizer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{event.organizer.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Organizer</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right — sticky action card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="action-card">
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 34, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 2 }}>
                  {isFree ? 'Free' : `₹${event.entryFee}`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {isFree ? 'No entry fee required' : 'Entry fee per person'}
                </div>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Waitlist status */}
                <AnimatePresence>
                  {isOnWaitlist && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ background: 'rgba(240,136,62,0.08)', border: '1px solid rgba(240,136,62,0.25)', borderRadius: 12, padding: '14px 16px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>⏳</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#f0883e', margin: 0, fontFamily: "'Syne',sans-serif" }}>You're on the waitlist</p>
                          <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>Position #{waitlistPosition} · We'll notify you if a spot opens</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLeaveWaitlist}
                        disabled={registering}
                        style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(248,81,73,0.25)', background: 'rgba(248,81,73,0.08)', color: '#f85149', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}
                      >
                        {registering ? '...' : 'Leave Waitlist'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Registered badge */}
                {isRegistered && (
  <>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(63,185,80,0.08)',
        border: '1px solid rgba(63,185,80,0.2)',
      }}
    >
      <span style={{ color: '#3fb950', fontSize: 16 }}>✓</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#3fb950',
        }}
      >
        You're registered for this event
      </span>
    </div>

    {qrDataUrl && (
      <button
        className="reg-btn"
        onClick={() => setShowQR(true)}
        style={{
          background: 'rgba(88,166,255,0.08)',
          color: '#58a6ff',
          border: '1px solid rgba(88,166,255,0.2)',
        }}
      >
        View Entry QR 🎟️
      </button>
    )}
  </>
)}

                {/* Main action button */}
                {user && event.status !== 'EXPIRED' && !isOnWaitlist ? (
                  <>
                    {isRegistered ? (
                      <button
                        className="reg-btn"
                        onClick={handleRegister}
                        disabled={registering}
                        style={{ background: 'rgba(248,81,73,0.08)', color: '#f85149', border: '1px solid rgba(248,81,73,0.25)' }}
                      >
                        {registering ? 'Cancelling...' : 'Cancel Registration'}
                      </button>
                    ) : spotsLeft === 0 ? (
                      <button
                        className="reg-btn"
                        onClick={handleRegister}
                        disabled={registering}
                        style={{ background: 'rgba(240,136,62,0.1)', color: '#f0883e', border: '1px solid rgba(240,136,62,0.25)' }}
                      >
                        {registering ? 'Joining...' : `Join Waitlist (${waitlistCount} ahead)`}
                      </button>
                    ) : (
                      <button
                        className="reg-btn"
                        onClick={handleRegister}
                        disabled={registering}
                        style={{ background: 'linear-gradient(135deg,#58a6ff,#a78bfa)', color: '#060910', boxShadow: '0 4px 20px rgba(88,166,255,0.25)' }}
                        onMouseEnter={e => { if (!registering) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
                      >
                        {registering ? 'Processing...' : isFree ? 'Register Now →' : `Pay ₹${event.entryFee} & Register →`}
                      </button>
                    )}
                    {isRegistered && event.entryFee > 0 && (
                      <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
                        95% refund on cancellation · 5% platform fee retained
                      </p>
                    )}
                  </>
                ) : event.status === 'EXPIRED' ? (
                  <button className="reg-btn" disabled style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                    Event Ended
                  </button>
                ) : !user ? (
                  <button className="reg-btn" disabled style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                    Login to Register
                  </button>
                ) : null}

                {/* Stats */}
                <div style={{ height: 1, background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '👥', label: `${participantCount} registered` },
                    { icon: '🎟️', label: spotsLeft > 0 ? `${spotsLeft} spots available` : 'No spots left' },
                    { icon: '⏳', label: waitlistCount > 0 ? `${waitlistCount} on waitlist` : 'No waitlist' },
                    { icon: '📅', label: new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
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

      <AnimatePresence>
  {showQR && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowQR(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 28,
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Event Entry Pass
        </h2>

        <p
          style={{
            fontSize: 13,
            color: 'var(--muted)',
            marginBottom: 20,
          }}
        >
          Show this QR at check-in
        </p>

        <img
          src={qrDataUrl}
          alt="Event QR Code"
          style={{
            width: '100%',
            maxWidth: 260,
            margin: '0 auto 20px',
            borderRadius: 12,
            background: 'white',
            padding: 12,
          }}
        />

        {registrationId && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              marginBottom: 20,
            }}
          >
            Registration ID: #{registrationId}
          </p>
        )}

        <button
          className="reg-btn"
          onClick={() => setShowQR(false)}
          style={{
            background: 'linear-gradient(135deg,#58a6ff,#a78bfa)',
            color: '#060910',
          }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </>
  );
}