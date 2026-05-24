'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { fireConfetti } from '@/lib/confetti';

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

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

  const handlePay = async () => {
    if (!user?.id) return;
    setPaying(true);
    try {
      await api.post(`/api/events/${id}/register`, { userId: user.id });
      fireConfetti();
      toast.success(`₹${event.entryFee} paid! You're registered 🎉`);
      router.push(`/dashboard/events/${id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Payment failed.');
    } finally { setPaying(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div style={{ color: 'var(--muted)' }}>Loading...</div>
    </div>
  );

  if (!event) return null;

  const canAfford = balance >= event.entryFee;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => router.back()} className="text-sm mb-4 block" style={{ color: 'var(--muted)' }}>
            ← Back
          </button>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--blue)' }}>
            Payment Confirmation
          </div>
          <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>{event.title}</h1>
        </div>

        {/* Event info */}
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

        {/* Payment breakdown */}
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

        {/* Wallet balance */}
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

        {/* Note on refund policy */}
        <div className="px-6 pt-4 text-xs" style={{ color: 'var(--muted)' }}>
          💡 Cancellation refund: 95% of fee. 5% platform charge is non-refundable.
        </div>

        {/* Action buttons */}
        <div className="p-6 flex gap-3">
          <button onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border font-semibold text-sm transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            Cancel
          </button>
          <button onClick={handlePay} disabled={paying || !canAfford}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-all"
            style={{ background: canAfford ? 'var(--blue)' : 'var(--surface2)' }}>
            {paying ? 'Processing...' : `Confirm & Pay ₹${event.entryFee}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}