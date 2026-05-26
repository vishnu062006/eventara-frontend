'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { fireConfetti } from '@/lib/confetti';
import QRCode from 'qrcode';

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [registrationId, setRegistrationId] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) { router.push('/'); return; }
    Promise.all([
      api.get(`/api/events/${id}`),
      api.get(`/api/wallet/${user.id}/balance`),
    ]).then(([evtRes, balRes]) => {
      setEvent(evtRes.data);
      setBalance(balRes.data.balance);
    }).catch(() => {
      toast.error('Failed to load payment details.');
      router.push('/dashboard');
    }).finally(() => setLoading(false));
  }, [id, user?.id]);

  const generateQR = async (regId: number) => {
    const qrData = JSON.stringify({
      eventara: true,
      registrationId: regId,
      eventId: id,
      userId: user?.id,
      name: user?.name,
      event: event?.title,
      timestamp: new Date().toISOString(),
    });
    const url = await QRCode.toDataURL(qrData, {
      width: 280,
      margin: 2,
      color: { dark: '#ffffff', light: '#0d1117' },
    });
    setQrDataUrl(url);
  };

  const handlePay = async () => {
    if (!user?.id) return;
    setPaying(true);
    try {
      const res = await api.post(`/api/events/${id}/register`, { userId: user.id });
      const regId = res.data.registrationId;
      setRegistrationId(regId);
      await generateQR(regId);
      setSuccess(true);
      fireConfetti();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Payment failed.');
    } finally { setPaying(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
        style={{ color: 'var(--muted)', fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Loading
      </motion.div>
    </div>
  );

  if (!event) return null;
  const canAfford = balance >= event.entryFee;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <AnimatePresence mode="wait">

        {/* Success + QR Screen */}
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm text-center"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl"
              style={{ background: 'rgba(63,185,80,0.15)', border: '2px solid rgba(63,185,80,0.4)' }}
            >
              ✓
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                You're registered!
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>
                ₹{event.entryFee} paid from wallet
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>
                Confirmation email sent to <span style={{ color: 'var(--text)', fontWeight: 600 }}>{user?.email}</span>
              </p>
            </motion.div>

            {/* Animated QR Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: 28,
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Animated border glow */}
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: 24,
                  background: 'linear-gradient(135deg, rgba(88,166,255,0.06), rgba(167,139,250,0.06))',
                  pointerEvents: 'none',
                }}
              />

              <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
                Your Entry Ticket
              </p>

              {/* QR Code */}
              {qrDataUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                  style={{ display: 'inline-block', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}
                >
                  <img src={qrDataUrl} alt="QR Code" style={{ width: 220, height: 220, display: 'block' }} />
                </motion.div>
              )}

              <div style={{ marginTop: 16 }}>
                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>
                  {event.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {new Date(event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' })} · {event.location}
                </p>
                {registrationId && (
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: 'monospace' }}>
                    #{String(registrationId).padStart(6, '0')}
                  </p>
                )}
              </div>

              {/* Scan hint */}
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ fontSize: 11, color: 'var(--muted)', marginTop: 14 }}
              >
                📱 Show this QR at the venue
              </motion.p>
            </motion.div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => router.push('/dashboard')}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
              >
                Back to Events
              </button>
              <button
                onClick={() => router.push(`/dashboard/events/${id}`)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--blue)', color: '#060910', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}
              >
                View Event →
              </button>
            </div>
          </motion.div>

        ) : (
          /* Payment Form */
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => router.back()} className="text-sm mb-4 block" style={{ color: 'var(--muted)' }}>
                ← Back
              </button>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--blue)' }}>
                Payment Confirmation
              </div>
              <h1 className="text-xl font-black" style={{ color: 'var(--text)', fontFamily: "'Syne',sans-serif" }}>
                {event.title}
              </h1>
            </div>

            <div className="p-6 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
              {[
                { label: 'Location', value: event.location },
                { label: 'Date', value: new Date(event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
                { label: 'Organizer', value: event.organizer?.name },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="p-6 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--muted)' }}>Entry Fee</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>₹{event.entryFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--muted)' }}>Platform Fee</span>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>₹0 (included)</span>
              </div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="font-bold" style={{ color: 'var(--text)' }}>Total</span>
                <span className="font-black" style={{ color: 'var(--blue)' }}>₹{event.entryFee}</span>
              </div>
            </div>

            <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--muted)' }}>Wallet Balance</span>
                <span className="font-black" style={{ color: canAfford ? '#3fb950' : '#f85149' }}>
                  ₹{balance.toFixed(2)}
                </span>
              </div>
              {!canAfford && (
                <div className="mt-2 text-xs p-3 rounded-lg" style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149' }}>
                  ⚠️ Insufficient balance. You need ₹{(event.entryFee - balance).toFixed(2)} more.
                </div>
              )}
              {canAfford && (
                <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                  After payment: ₹{(balance - event.entryFee).toFixed(2)}
                </div>
              )}
            </div>

            <div className="px-6 pt-4 text-xs" style={{ color: 'var(--muted)' }}>
              💡 Cancellation refund: 95% of fee. 5% platform charge is non-refundable.
            </div>

            <div className="p-6 flex gap-3">
              <button onClick={() => router.back()}
                className="flex-1 py-3 rounded-xl border font-semibold text-sm transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                Cancel
              </button>
              <button onClick={handlePay} disabled={paying || !canAfford}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                style={{ background: canAfford ? 'var(--blue)' : 'var(--surface2)', color: canAfford ? '#060910' : 'var(--muted)', fontFamily: "'Syne',sans-serif" }}>
                {paying ? 'Processing...' : `Confirm & Pay ₹${event.entryFee}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}