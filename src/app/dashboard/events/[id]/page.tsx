'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { fireConfetti } from '@/lib/confetti';
import { 
  ArrowLeft, CalendarDays, MapPin, Clock, Users, Ticket, 
  User as UserIcon, QrCode, ShieldCheck, X, CheckCircle2,
  ChevronRight, AlertCircle, Trash2
} from 'lucide-react';

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

// --- Next-Gen Hover Card ---
function GlassCard({ children, className, style }: { children: React.ReactNode; className?: string, style?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [3, -3]), { stiffness: 400, damping: 40 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-3, 3]), { stiffness: 400, damping: 40 });
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
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1200, ...style }}
      className={`relative rounded-[2rem] bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl overflow-hidden ${className}`}
    >
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useTransform(
            [glareX, glareY],
            ([gx, gy]) => `radial-gradient(circle 300px at ${gx} ${gy}, rgba(255,255,255,0.08), transparent)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

// --- Countdown Hook ---
function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, started: false });
  useEffect(() => {
    if (!targetDate) return;
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
    if (!time) return '';
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
      toast.error('Failed to load event details.');
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
  
    if (!isRegistered && event?.entryFee && event.entryFee > 0) {
      router.push(`/dashboard/payment/${id}`);
      return;
    }
  
    setRegistering(true);
  
    try {
      if (isRegistered) {
        await api.delete(`/api/events/${id}/register`, { data: { userId: user.id } });
        setIsRegistered(false);
        setParticipantCount(c => c - 1);
        setShowQR(false);
        setQrDataUrl('');
        setRegistrationId(null);
        toast.success('Registration cancelled.');
      } else {
        const res = await api.post(`/api/events/${id}/register`, { userId: user.id });
  
        if (res.status === 202 && res.data.waitlisted) {
          const msg = res.data.message as string;
          const pos = msg.match(/#(\d+)/)?.[1];
          setWaitlistPosition(parseInt(pos ?? '1'));
          setWaitlistCount(c => c + 1);
          toast.success(`Added to waitlist at position #${pos}`);
        } else {
          setIsRegistered(true);
          setParticipantCount(c => c + 1);
          if (res.data?.registrationId) setRegistrationId(res.data.registrationId);
          if (res.data?.qrCode) setQrDataUrl(res.data.qrCode);
          fireConfetti();
          toast.success("You're in! 🎉");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Action failed.');
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

  const handleCancelRegistration = async () => {
    try {
      setRegistering(true);
      await api.delete(`/api/events/${event?.id}/register`, { data: { userId: user?.id } });
      toast.success('Registration cancelled successfully');
      setIsRegistered(false);
      setParticipantCount(c => Math.max(0, c - 1));
    } catch (err) {
      toast.error('Failed to cancel registration');
    } finally {
      setRegistering(false);
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

  const isOnWaitlist = waitlistPosition > 0;
  const spotsLeft = event.maxParticipants - participantCount;
  const fillPercent = Math.min(100, (participantCount / event.maxParticipants) * 100);
  const isFree = !event.entryFee || event.entryFee === 0;

  const statusMap: Record<string, { color: string; bg: string; label: string; border: string }> = {
    UPCOMING: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Upcoming' },
    ONGOING:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Live Now' },
    EXPIRED:  { color: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10', label: 'Ended' },
  };
  const s = statusMap[event.status] ?? statusMap.EXPIRED;

  return (
    <div className="min-h-screen bg-[#030305] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      
      {/* Ambient Deep Space Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <div className="max-w-[1200px] mx-auto w-full relative z-10 px-6 pt-10 pb-20">
        
        {/* Navigation */}
        <motion.button
          onClick={() => router.back()}
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 px-4 py-2 mb-6 text-sm font-bold tracking-wide transition-colors border rounded-xl bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.06] hover:border-white/10 backdrop-blur-md w-fit"
        >
          <ArrowLeft size={16} /> Back to Events
        </motion.button>

        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative w-full h-[350px] md:h-[450px] rounded-[2rem] overflow-hidden mb-10 border border-white/10 bg-white/[0.02]"
        >
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-cyan-900/40 flex items-center justify-center">
               <span className="text-[120px] font-black text-white/5 uppercase tracking-tighter">
                 {event.title.slice(0, 2)}
               </span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${s.bg} ${s.color} ${s.border}`}>
                {event.status === 'ONGOING' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {s.label}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                {isFree ? 'Free Entry' : `₹${event.entryFee}`}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2 leading-none drop-shadow-lg">
              {event.title}
            </h1>
          </div>
        </motion.div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          
          {/* LEFT COLUMN: Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-8">
            
            {/* Description */}
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-slate-300 font-medium">{event.description}</p>
            </div>

            {/* Countdown Timer */}
            {event.status === 'UPCOMING' && !countdown.started && (
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4">Event Starts In</h3>
                <div className="grid grid-cols-4 gap-3 md:gap-4">
                  {[
                    { val: countdown.d, label: 'Days' },
                    { val: countdown.h, label: 'Hours' },
                    { val: countdown.m, label: 'Mins' },
                    { val: countdown.s, label: 'Secs' }
                  ].map(({ val, label }) => (
                    <GlassCard key={label} className="flex flex-col items-center justify-center py-4 px-2 border-white/10">
                      <span className="text-3xl md:text-4xl font-black text-white tracking-tighter tabular-nums leading-none mb-1">
                        {String(val).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">{label}</span>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            {/* Comprehensive Details Card */}
            <GlassCard className="flex flex-col border-white/10">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500">Event Information</h3>
              </div>
              
              <div className="divide-y divide-white/5">
                {[
                  { icon: CalendarDays, label: 'Date', value: new Date(event.eventDate).toLocaleDateString('en-IN', { dateStyle: 'full' }) },
                  { icon: Clock, label: 'Time', value: event.startTime && event.endTime ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}` : 'To be announced' },
                  { icon: MapPin, label: 'Location', value: event.location },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 p-6 hover:bg-white/[0.02] transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400 border border-white/5 shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
                      <div className="text-base font-semibold text-white">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Organizer Section */}
              {event.organizer && (
                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white font-black text-lg border border-white/20 shrink-0">
                    {event.organizer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white leading-tight">{event.organizer.name}</div>
                    <div className="text-xs font-medium text-cyan-400">Event Organizer</div>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* RIGHT COLUMN: Action Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="sticky top-8">
              <GlassCard className="flex flex-col border-white/10 shadow-2xl">
                
                {/* Price Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent">
                  <div className="text-5xl font-black text-white tracking-tighter mb-2">
                    {isFree ? 'Free' : <>₹{event.entryFee}</>}
                  </div>
                  <div className="text-sm font-medium text-slate-400">
                    {isFree ? 'Standard Entry Pass' : 'Per Person Entry Fee'}
                  </div>
                </div>

                <div className="p-8 flex flex-col gap-6">
                  
                  {/* Capacity Tracker */}
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-400">Capacity Filled</span>
                      <span className={spotsLeft === 0 ? 'text-rose-400' : spotsLeft <= 5 ? 'text-orange-400' : 'text-cyan-400'}>
                        {spotsLeft === 0 ? 'Full' : `${spotsLeft} spots left`}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${fillPercent}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${fillPercent > 90 ? 'bg-gradient-to-r from-rose-500 to-orange-400' : 'bg-gradient-to-r from-violet-500 to-cyan-400'}`}
                      />
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/5" />

                  {/* Contextual Actions */}
                  <AnimatePresence mode="wait">
                    {isOnWaitlist ? (
                      <motion.div key="waitlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
                          <AlertCircle className="text-orange-400 shrink-0 mt-0.5" size={18} />
                          <div>
                            <h4 className="text-sm font-bold text-orange-400 mb-1">Waitlist Position #{waitlistPosition}</h4>
                            <p className="text-xs text-orange-400/80">We'll notify you instantly if a spot opens up for you.</p>
                          </div>
                        </div>
                        <button
                          onClick={handleLeaveWaitlist} disabled={registering}
                          className="w-full py-4 rounded-xl border border-rose-500/30 text-rose-400 text-sm font-bold hover:bg-rose-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {registering ? 'Processing...' : <><Trash2 size={16} /> Leave Waitlist</>}
                        </button>
                      </motion.div>
                    ) : isRegistered ? (
                      <motion.div key="registered" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                          <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                          <h4 className="text-sm font-bold text-emerald-400">You're registered!</h4>
                        </div>
                        
                        {qrDataUrl && (
                          <button
                            onClick={() => setShowQR(true)}
                            className="w-full py-4 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                          >
                            <QrCode size={18} /> View Entry Pass
                          </button>
                        )}

                        <button
                          onClick={handleCancelRegistration} disabled={registering}
                          className="w-full py-4 rounded-xl border border-white/5 text-slate-400 text-sm font-bold hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors disabled:opacity-50 mt-2"
                        >
                          {registering ? 'Cancelling...' : 'Cancel Registration'}
                        </button>
                      </motion.div>
                    ) : event.status === 'EXPIRED' ? (
                      <button disabled className="w-full py-4 rounded-xl bg-white/5 text-slate-500 text-sm font-bold cursor-not-allowed">
                        Event Concluded
                      </button>
                    ) : !user ? (
                      <button disabled className="w-full py-4 rounded-xl bg-white/5 text-slate-500 text-sm font-bold border border-white/5">
                        Log in to Register
                      </button>
                    ) : spotsLeft === 0 ? (
                      <button
                        onClick={handleRegister} disabled={registering}
                        className="w-full py-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-bold hover:bg-orange-500/20 transition-all disabled:opacity-50"
                      >
                        {registering ? 'Processing...' : `Join Waitlist (${waitlistCount} ahead)`}
                      </button>
                    ) : (
                      <button
                        onClick={handleRegister} disabled={registering}
                        className="w-full py-4 rounded-xl bg-white text-black text-sm font-extrabold tracking-wide hover:bg-cyan-400 active:scale-95 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {registering ? 'Processing...' : isFree ? 'Register Now' : `Pay ₹${event.entryFee} & Register`} <ChevronRight size={16} />
                      </button>
                    )}
                  </AnimatePresence>

                  {/* Summary Stats */}
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-2"><Users size={14} /> Registered</span>
                      <span className="text-white">{participantCount}</span>
                    </div>
                    {waitlistCount > 0 && (
                      <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-2"><Clock size={14} /> On Waitlist</span>
                        <span className="text-orange-400">{waitlistCount}</span>
                      </div>
                    )}
                  </div>

                  {!isFree && event.status !== 'EXPIRED' && (
                    <div className="mt-2 text-center text-[10px] text-slate-500 font-medium">
                      Secure payment via Wallet • 95% refund on cancellation
                    </div>
                  )}

                </div>
              </GlassCard>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- QR CODE MODAL --- */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowQR(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden border rounded-[2rem] bg-[#0a0a0f] border-white/10 shadow-2xl relative p-8 text-center"
            >
              {/* Modal Gradients */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                  <Ticket size={32} className="text-white" />
                </div>
                
                <h2 className="text-2xl font-black tracking-tight text-white mb-2">Entry Pass</h2>
                <p className="text-xs font-medium text-slate-400 mb-8">Present this QR code at the check-in desk.</p>

                <div className="bg-white p-4 rounded-2xl mx-auto w-fit mb-6 shadow-xl">
                  <img src={qrDataUrl} alt="Event QR Code" className="w-48 h-48 object-contain" />
                </div>

                {registrationId && (
                  <div className="inline-block px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase text-cyan-400 mb-8">
                    ID: #{registrationId}
                  </div>
                )}

                <button
                  onClick={() => setShowQR(false)}
                  className="w-full py-4 text-sm font-bold text-white transition-all rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
                >
                  Close Pass
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}