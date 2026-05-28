'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, type Variants } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import QRCode from 'qrcode';
import { 
  CalendarDays, MapPin, Ticket, X, Download, AlertCircle, 
  CheckCircle2, QrCode, Clock, User as UserIcon, Building2, Image as ImageIcon
} from 'lucide-react';

type RegistrationEvent = {
  id: number;
  title: string;
  status: 'UPCOMING' | 'ONGOING' | 'EXPIRED';
  entryFee: number;
  eventDate: string;
  location: string;
  qrUrl?: string;
  registrationId?: number;
  imageUrl?: string;
  organizer?: { id: number; name: string };
};

// --- Next-Gen Hover Card ---
function GlassCard({ children, className, style }: { children: React.ReactNode; className?: string, style?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [2, -2]), { stiffness: 400, damping: 40 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-2, 2]), { stiffness: 400, damping: 40 });

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
      className={`relative rounded-[2rem] bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

// --- Holographic Ticket for Modal ---
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
      className="relative w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl"
    >
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"
        style={{
          background: useTransform([glareX, glareY], ([gx, gy]) => `radial-gradient(circle 250px at ${gx} ${gy}, rgba(255,255,255,0.4), transparent)`),
        }}
      />
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = { 
  hidden: { opacity: 0, y: 20 }, 
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } 
};

// Mock categories for visual realism based on event ID
const getCategory = (id: number) => ['TECH', 'CULTURAL', 'WORKSHOP', 'SPORTS', 'SEMINAR'][id % 5];

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
          v: 1,
          eventara: true,
          registrationId: event.registrationId,
          eventId: event.id,
          userId: user?.id,
          timestamp: new Date().getTime(),
        });
        qrUrl = await QRCode.toDataURL(qrData, {
          width: 250, margin: 1,
          color: { dark: '#000000', light: '#ffffff' }, 
          errorCorrectionLevel: 'H'
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
    UPCOMING: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Upcoming', icon: CalendarDays },
    ONGOING:  { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Live Now', icon: Clock },
    EXPIRED:  { color: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10', label: 'Concluded', icon: CheckCircle2 },
  };

  return (
    <div className="min-h-screen bg-[#030305] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      <Navbar />

      {/* Ambient Deep Space Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20 relative z-10">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[2px] w-8 bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Activity</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">My Registrations</h1>
          <p className="text-slate-400 font-medium">
            {registrations.length > 0 ? `You have ${registrations.length} active event pass${registrations.length > 1 ? 'es' : ''}.` : 'Manage your event attendances here.'}
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-[2rem] bg-white/[0.02] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
            <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <Ticket size={40} className="text-slate-500" />
            </div>
            <p className="font-black text-2xl text-white mb-2 tracking-tight">No registrations yet</p>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">
              Your digital tickets will appear here once you join an event.
            </p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
            {registrations.map((event) => {
              const s = statusConfig[event.status];
              const StatusIcon = s.icon;
              
              return (
                <motion.div variants={fadeUp} key={event.id}>
                  <GlassCard className="p-0 hover:bg-white/[0.04] transition-colors group flex flex-col md:flex-row overflow-hidden border-t-0 md:border-t-white/[0.08] border-l-4 md:border-l-cyan-400/50">
                    
                    {/* 1. VISUAL IDENTITY: Thumbnail & Category */}
                    <div className="relative w-full md:w-56 h-48 md:h-auto shrink-0 bg-white/5 border-b md:border-b-0 md:border-r border-white/5">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-600/30 to-cyan-600/30 flex items-center justify-center">
                           <ImageIcon size={32} className="text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] md:from-transparent to-transparent opacity-80" />
                      
                      {/* Category Chip */}
                      <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[9px] font-bold uppercase tracking-widest text-cyan-400 shadow-xl">
                        {getCategory(event.id)}
                      </div>
                    </div>

                    {/* 2. PREMIUM DETAILS */}
                    <div className="p-6 md:p-8 flex-1 flex flex-col justify-center relative">
                      
                      {/* Organizer Identity */}
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 size={12} className="text-violet-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          by {event.organizer?.name || 'Eventara Host'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-black text-2xl text-white tracking-tight truncate mb-4 group-hover:text-cyan-400 transition-colors drop-shadow-md">
                        {event.title}
                      </h3>
                      
                      {/* Sub-info */}
                      <div className="flex items-center gap-5 flex-wrap text-sm font-medium text-slate-400 mb-6">
                        <span className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-slate-500" />
                          {new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-500" />
                          <span className="truncate max-w-[200px]">{event.location}</span>
                        </span>
                      </div>

                      {/* Status Metadata (Integrated, not floating) */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${s.bg} ${s.color} ${s.border}`}>
                          <StatusIcon size={12} /> {s.label}
                        </span>
                        
                        {event.entryFee === 0 ? (
                           <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                             Free Entry
                           </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Paid ₹{event.entryFee}
                          </span>
                        )}

                        {event.qrUrl && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                            <QrCode size={12} /> Ticket Saved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3. STRICT ACTION HIERARCHY */}
                    <div className="p-6 md:p-8 bg-black/20 border-t md:border-t-0 md:border-l border-white/5 flex flex-row md:flex-col items-center justify-center gap-4 shrink-0 md:w-56">
                      
                      {/* Primary CTA (Dominates visually) */}
                      <button
                        onClick={() => generateAndShowQR(event)}
                        disabled={generatingQR === event.id}
                        className="w-full flex items-center justify-center gap-2 text-sm font-black px-6 py-3.5 rounded-xl bg-cyan-400 text-[#030305] hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 group/btn"
                      >
                        {generatingQR === event.id ? 'Generating...' : <><Ticket size={16} /> View Pass</>}
                      </button>
                      
                      {/* Secondary/Destructive (Ghost) */}
                      {event.status !== 'EXPIRED' && (
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to cancel this registration? A 5% platform fee may be retained.")) {
                              handleCancel(event.id);
                            }
                          }}
                          className="w-full text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-rose-400 transition-colors py-2"
                        >
                          Cancel Registration
                        </button>
                      )}
                    </div>

                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* QR MODAL (Holographic Ticket) */}
      <AnimatePresence>
        {activeQR && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setActiveQR(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="group mb-6">
                <HolographicTicket>
                  <div className="flex flex-col drop-shadow-2xl">
                    
                    {/* Top Half: Event Details */}
                    <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-2xl border border-white/20 rounded-t-3xl p-6 relative overflow-hidden text-center">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 blur-3xl rounded-full" />
                      <div className="absolute top-0 left-0 w-32 h-32 bg-violet-400/20 blur-3xl rounded-full" />
                      
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <QrCode size={16} className="text-cyan-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Entry Pass</span>
                      </div>
                      
                      <h2 className="text-2xl font-black text-white leading-tight mb-3 drop-shadow-md relative z-10">{activeQR.title}</h2>
                      
                      <div className="flex flex-col items-center gap-1 text-xs font-medium text-slate-300 relative z-10">
                        <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-cyan-400" /> {new Date(activeQR.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-cyan-400" /> {activeQR.location}</span>
                      </div>
                    </div>

                    {/* Perforated Divider */}
                    <div className="relative flex items-center bg-white/[0.03] backdrop-blur-2xl border-x border-white/20 h-10">
                      <div className="absolute -left-5 w-10 h-10 rounded-full bg-[#030305] shadow-inner border-r border-white/20 z-10" />
                      <div className="w-full border-t-2 border-dashed border-white/20 mx-4" />
                      <div className="absolute -right-5 w-10 h-10 rounded-full bg-[#030305] shadow-inner border-l border-white/20 z-10" />
                    </div>

                    {/* Bottom Half: QR & ID */}
                    <div className="bg-gradient-to-t from-white/[0.08] to-white/[0.03] backdrop-blur-2xl border border-white/20 border-t-0 rounded-b-3xl p-6 relative overflow-hidden">
                      
                      {activeQR.qrUrl && (
                        <div className="bg-white p-3 rounded-2xl mx-auto w-fit shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-10 transform group-hover:scale-105 transition-transform duration-500 mb-6">
                          <img src={activeQR.qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
                        </div>
                      )}

                      <div className="flex justify-between items-end relative z-10">
                        <div>
                          <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-1">Attendee</p>
                          <p className="text-sm font-bold text-white flex items-center gap-1.5 line-clamp-1">
                            <UserIcon size={12} className="text-violet-400 shrink-0" /> {user?.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-1">Ticket ID</p>
                          <p className="text-xs font-mono font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded border border-cyan-400/20">
                            REG#{String(activeQR.registrationId).padStart(6, '0')}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </HolographicTicket>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setActiveQR(null)}
                  className="flex-1 py-4 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} /> Close
                </button>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = activeQR.qrUrl!;
                    a.download = `eventara-ticket-${activeQR.id}.png`;
                    a.click();
                  }}
                  className="flex-1 py-4 rounded-xl bg-cyan-400 text-[#030305] text-sm font-black hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Save Image
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}