'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { fireConfetti } from '@/lib/confetti';
import QRCode from 'qrcode';
import { 
  ArrowLeft, Wallet, ShieldCheck, Ticket, CalendarDays, MapPin, 
  CheckCircle2, AlertCircle, ChevronRight, User as UserIcon
} from 'lucide-react';

// --- Holographic Hover Effect for the Ticket ---
function HolographicTicket({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });
  const glareX = useTransform(x, [-0.5, 0.5], ['-20%', '120%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['-20%', '120%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      className="relative w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl"
    >
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"
        style={{
          background: useTransform(
            [glareX, glareY],
            ([gx, gy]) => `radial-gradient(circle 250px at ${gx} ${gy}, rgba(255,255,255,0.4), transparent)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

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
    // Standardized Payload for Organizer Validation
    const qrData = JSON.stringify({
      v: 1, // Versioning for future updates
      regId: regId,
      eventId: id,
      userId: user?.id,
      timestamp: new Date().getTime(),
    });
    const url = await QRCode.toDataURL(qrData, {
      width: 250,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }, // Max contrast for physical scanners
      errorCorrectionLevel: 'H' // High error correction for fast scanning
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
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Payment failed.');
    } finally { 
      setPaying(false); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center">
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-16 h-16 rounded-full border-t-2 border-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!event) return null;
  const canAfford = balance >= event.entryFee;

  return (
    <div className="min-h-screen bg-[#030305] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative flex items-center justify-center p-6 py-20">
      
      {/* Ambient Deep Space Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">

          {success ? (
            /* --- PREMIUM TICKETING SCREEN --- */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="text-center w-full"
            >
              <h1 className="text-2xl font-black text-white tracking-tight mb-2">Registration Confirmed</h1>
              <p className="text-emerald-400 font-bold text-sm mb-6 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> ₹{event.entryFee} paid securely
              </p>

              {/* THE PREMIUM TICKET */}
              <div className="mb-8 group">
                <HolographicTicket>
                  <div className="flex flex-col drop-shadow-2xl">
                    
                    {/* Top Half: Event Details */}
                    <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-2xl border border-white/20 rounded-t-3xl p-6 relative overflow-hidden">
                      {/* Subtle background glow inside ticket */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 blur-3xl rounded-full" />
                      
                      {event.imageUrl && (
                        <div className="w-full h-32 mb-5 rounded-xl overflow-hidden relative border border-white/10">
                          <img src={event.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex gap-2">
                            <span className="px-2.5 py-1 bg-cyan-500/30 backdrop-blur-md border border-cyan-400/30 text-cyan-300 text-[9px] font-bold uppercase tracking-widest rounded-md">
                              Official Pass
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="text-left relative z-10">
                        <h2 className="text-2xl font-black text-white leading-tight mb-3 drop-shadow-md">{event.title}</h2>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-300">
                            <CalendarDays size={16} className="text-cyan-400" />
                            {new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-300 line-clamp-1">
                            <MapPin size={16} className="text-cyan-400 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Perforated Divider */}
                    <div className="relative flex items-center bg-white/[0.03] backdrop-blur-2xl border-x border-white/20 h-10">
                      {/* Left Cutout */}
                      <div className="absolute -left-5 w-10 h-10 rounded-full bg-[#030305] shadow-inner border-r border-white/20 z-10" />
                      {/* Dashed Line */}
                      <div className="w-full border-t-2 border-dashed border-white/20 mx-4" />
                      {/* Right Cutout */}
                      <div className="absolute -right-5 w-10 h-10 rounded-full bg-[#030305] shadow-inner border-l border-white/20 z-10" />
                    </div>

                    {/* Bottom Half: QR & Attendee */}
                    <div className="bg-gradient-to-t from-white/[0.08] to-white/[0.03] backdrop-blur-2xl border border-white/20 border-t-0 rounded-b-3xl p-6 pb-8 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6 text-left relative z-10">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Attendee</p>
                          <p className="text-base font-bold text-white flex items-center gap-2">
                            <UserIcon size={14} className="text-violet-400" /> {user?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Ticket ID</p>
                          <p className="text-sm font-mono font-bold text-cyan-400">
                            #{String(registrationId).padStart(6, '0')}
                          </p>
                        </div>
                      </div>

                      {qrDataUrl && (
                        <div className="bg-white p-3 rounded-2xl mx-auto w-fit shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-10 transform group-hover:scale-105 transition-transform duration-500">
                          <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 object-contain" />
                        </div>
                      )}
                      
                      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-6 relative z-10">
                        Ready for scanning
                      </p>
                    </div>

                  </div>
                </HolographicTicket>
              </div>

              {/* Navigation */}
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 py-4 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-bold hover:bg-white/10 transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push(`/dashboard/events/${id}`)}
                  className="flex-1 py-4 rounded-xl bg-cyan-400 text-black text-sm font-black hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  View Event <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>

          ) : (
            
            /* --- PAYMENT FORM (Untouched styling from previous message) --- */
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            >
              <button 
                onClick={() => router.back()} 
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft size={14} /> Cancel Payment
              </button>

              <div className="relative rounded-[2rem] bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1.5 w-6 bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Checkout</p>
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight leading-tight mb-2">
                    {event.title}
                  </h1>
                  <p className="text-sm text-slate-400 font-medium">
                    Secure checkout via Eventara Wallet
                  </p>
                </div>

                {/* Event Summary */}
                <div className="p-8 border-b border-white/5 space-y-4 bg-white/[0.01]">
                  {[
                    { icon: MapPin, label: 'Venue', value: event.location },
                    { icon: CalendarDays, label: 'Date', value: new Date(event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) },
                    { icon: Ticket, label: 'Organizer', value: event.organizer?.name || 'Eventara Host' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-slate-400"><Icon size={14} /> {label}</span>
                      <span className="text-sm font-semibold text-white text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Cost Breakdown */}
                <div className="p-8 border-b border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-sm text-slate-300">
                    <span>Entry Ticket</span>
                    <span className="font-semibold text-white">₹{event.entryFee}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-400">
                    <span>Platform Fee</span>
                    <span>Included</span>
                  </div>
                  <div className="pt-4 border-t border-dashed border-white/10 flex justify-between items-center">
                    <span className="font-bold text-white text-base">Total Due</span>
                    <span className="text-2xl font-black text-cyan-400">₹{event.entryFee}</span>
                  </div>
                </div>

                {/* Wallet Status */}
                <div className="p-8 bg-black/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                      <Wallet size={16} className="text-violet-400" /> Wallet Balance
                    </span>
                    <span className={`text-lg font-black ${canAfford ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹{balance.toFixed(2)}
                    </span>
                  </div>

                  {!canAfford ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-rose-400 mb-1">Insufficient Funds</h4>
                          <p className="text-xs text-rose-400/80 leading-relaxed">
                            You need <strong className="text-rose-300">₹{(event.entryFee - balance).toFixed(2)}</strong> more to complete this purchase.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => router.push('/dashboard/wallet')}
                        className="w-full py-2.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition-colors border border-rose-500/30"
                      >
                        Add Funds to Wallet
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-400">
                      <span>Balance after payment:</span>
                      <span className="font-bold text-white">₹{(balance - event.entryFee).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* CTA Actions */}
                <div className="p-8 pt-4">
                  <button 
                    onClick={handlePay} 
                    disabled={paying || !canAfford}
                    className="group relative w-full py-4 rounded-xl font-extrabold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 overflow-hidden mb-4
                    bg-white text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                  >
                    {!canAfford ? (
                      'Cannot Proceed'
                    ) : paying ? (
                      'Processing Payment...'
                    ) : (
                      <>Confirm & Pay ₹{event.entryFee} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                    
                    {canAfford && !paying && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Secure payment • 95% Refundable on cancellation
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}