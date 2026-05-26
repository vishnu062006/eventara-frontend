'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import QRCode from 'qrcode';

type RegistrationEvent = {
  id: number;
  title: string;
  status: 'UPCOMING' | 'ONGOING' | 'EXPIRED';
  entryFee: number;
  eventDate: string;
  location: string;
  qrUrl?: string;
  registrationId?: number;
};

export default function MyRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQR, setActiveQR] = useState<RegistrationEvent | null>(null);
  const [generatingQR, setGeneratingQR] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) fetchRegistrations();
  }, [user]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const eventsRes = await api.get('/api/events');
      const events = eventsRes.data;
      const myRegs: RegistrationEvent[] = [];

      await Promise.all(
        events.map(async (event: any) => {
          try {
            const partRes = await api.get(`/api/events/${event.id}/participants`);
            const myParticipant = partRes.data.find((p: any) => p.user.id === user?.id);
            if (myParticipant) {
              const savedQr = localStorage.getItem(`qr_${event.id}`);
              const savedRegId = localStorage.getItem(`qr_reg_${event.id}`);
              myRegs.push({
                ...event,
                qrUrl: savedQr || undefined,
                registrationId: savedRegId ? Number(savedRegId) : myParticipant.id,
              });
            }
          } catch {}
        })
      );

      myRegs.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
      setRegistrations(myRegs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateAndShowQR = async (event: RegistrationEvent) => {
    setGeneratingQR(event.id);
    try {
      let qrUrl = event.qrUrl;
      if (!qrUrl) {
        const qrData = JSON.stringify({
          eventara: true,
          registrationId: event.registrationId,
          eventId: event.id,
          userId: user?.id,
          name: user?.name,
          event: event.title,
          timestamp: new Date().toISOString(),
        });
        qrUrl = await QRCode.toDataURL(qrData, {
          width: 280,
          margin: 2,
          color: { dark: '#ffffff', light: '#0d1117' },
        });
        localStorage.setItem(`qr_${event.id}`, qrUrl);
        setRegistrations(prev => prev.map(r => r.id === event.id ? { ...r, qrUrl } : r));
      }
      setActiveQR({ ...event, qrUrl });
    } finally {
      setGeneratingQR(null);
    }
  };

  const handleCancel = async (eventId: number) => {
    try {
      await api.delete(`/api/events/${eventId}/register`, { data: { userId: user?.id } });
      localStorage.removeItem(`qr_${eventId}`);
      localStorage.removeItem(`qr_reg_${eventId}`);
      fetchRegistrations();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const statusConfig = {
    UPCOMING: { color: '#3fb950', bg: 'rgba(63,185,80,0.08)', label: '🟢 Upcoming' },
    ONGOING:  { color: '#f0883e', bg: 'rgba(240,136,62,0.08)', label: '🟡 Ongoing' },
    EXPIRED:  { color: '#8b949e', bg: 'rgba(139,148,158,0.08)', label: '⚫ Expired' },
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--blue)' }}>
            — My Activity
          </p>
          <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--text)'}}>
            My Registrations
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
            {registrations.length > 0 ? `${registrations.length} event${registrations.length > 1 ? 's' : ''} registered` : 'No registrations yet'}
          </p>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24"
            >
              <div className="text-6xl mb-4">🎫</div>
              <p className="font-black text-xl mb-2" style={{ color: 'var(--text)' }}>
                No registrations yet
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Browse events and register for ones you like!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {registrations.map((event, i) => {
                const s = statusConfig[event.status];
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl p-5 border transition-all"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(88,166,255,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ color: s.color, background: s.bg }}
                          >
                            {s.label}
                          </span>
                          {event.entryFee > 0 && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ color: '#f0883e', background: 'rgba(240,136,62,0.08)' }}>
                              ₹{event.entryFee}
                            </span>
                          )}
                          {event.qrUrl && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ color: '#58a6ff', background: 'rgba(88,166,255,0.08)' }}>
                              🎟 Ticket Ready
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-base truncate" style={{ color: 'var(--text)'}}>
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>
                            📅 {new Date(event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>
                            📍 {event.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => generateAndShowQR(event)}
                          disabled={generatingQR === event.id}
                          className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors disabled:opacity-50"
                          style={{ color: '#58a6ff', background: 'rgba(88,166,255,0.08)', borderColor: 'rgba(88,166,255,0.2)' }}
                        >
                          {generatingQR === event.id ? '...' : '🎟 Ticket'}
                        </button>
                        {event.status !== 'EXPIRED' && (
                          <button
                            onClick={() => handleCancel(event.id)}
                            className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors"
                            style={{ color: '#f85149', background: 'rgba(248,81,73,0.08)', borderColor: 'rgba(248,81,73,0.2)' }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {activeQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setActiveQR(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 28, padding: 32, maxWidth: 360, width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Glow effect */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(88,166,255,0.05), rgba(167,139,250,0.05))', pointerEvents: 'none', borderRadius: 28 }}
              />

              <button
                onClick={() => setActiveQR(null)}
                style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}
              >
                ✕
              </button>

              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Entry Ticket
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4, lineHeight: 1.2 }}>
                {activeQR.title}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>
                {new Date(activeQR.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' })} · {activeQR.location}
              </p>

              {activeQR.qrUrl && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  style={{ display: 'inline-block', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}
                >
                  <img src={activeQR.qrUrl} alt="QR Code" style={{ width: 220, height: 220, display: 'block' }} />
                </motion.div>
              )}

              {activeQR.registrationId && (
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginBottom: 8 }}>
                  REG#{String(activeQR.registrationId).padStart(6, '0')}
                </p>
              )}

              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}
              >
                📱 Show this QR at the venue for entry
              </motion.p>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setActiveQR(null)}
                  style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = activeQR.qrUrl!;
                    a.download = `eventara-ticket-${activeQR.id}.png`;
                    a.click();
                  }}
                  style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', background: 'var(--blue)', color: '#060910', fontSize: 13, fontWeight: 700, cursor: 'pointer'}}
                >
                  Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}