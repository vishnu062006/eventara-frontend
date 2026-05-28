'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { 
  Calendar, Clock, MapPin, Users, UploadCloud, Image as ImageIcon, 
  IndianRupee, Tag, Info, CheckCircle2, AlertCircle, ArrowRight, Sparkles, 
  X,
  CalendarDays
} from 'lucide-react';

// --- Next-Gen Hover Card for Live Preview ---
function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [3, -3]), { stiffness: 400, damping: 40 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-3, 3]), { stiffness: 400, damping: 40 });

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
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1200 }}
      className={`relative rounded-[2rem] bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function CreateEvent() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', description: '', eventDate: '',
    startTime: '', endTime: '', location: '',
    maxParticipants: '', entryFee: '0',
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user || (user.role !== 'EVENT_ADMIN' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030305] text-slate-200">
        <Navbar />
        <div className="text-center max-w-md mx-auto p-8 border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-[2rem] shadow-2xl">
          <div className="w-20 h-20 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="font-black text-3xl mb-3 text-white tracking-tight">Access Denied</h2>
          <p className="text-slate-400 text-base">Only Event Admins and System Admins can access the creation studio.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-8 px-6 py-3 w-full bg-white/5 hover:bg-white/10 text-white transition-colors rounded-xl font-bold border border-white/10"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | undefined;
    if ('dataTransfer' in e) file = e.dataTransfer.files?.[0];
    else file = e.target.files?.[0];

    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { 
      setErrorMsg('Image must be under 5MB'); 
      setTimeout(() => setErrorMsg(null), 3000);
      return; 
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const res = await api.post('/api/events/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.imageUrl;
    } catch {
      setErrorMsg('Image upload failed. Event will be created without a banner.');
      setTimeout(() => setErrorMsg(null), 4000);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!form.title || !form.eventDate || !form.location || !form.maxParticipants) {
      setErrorMsg('Please fill all required fields (marked with *).');
      return;
    }
    
    setLoading(true);
    try {
      const imageUrl = await uploadImage();
      await api.post('/api/events', {
        ...form,
        eventDate: form.eventDate + ':00',
        startTime: form.startTime ? form.startTime + ':00' : null,
        endTime: form.endTime ? form.endTime + ':00' : null,
        organizerId: String(user.id),
        imageUrl: imageUrl || '',
      });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const formatPreviewDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#030305] font-sans text-slate-200 pb-24 selection:bg-cyan-500/30 overflow-x-hidden relative">
      
      {/* Deep Space Ambient Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <Navbar />
      
      <main className="max-w-[1400px] mx-auto px-6 pt-28 lg:pt-36 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
            <div className="h-[2px] w-8 bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Creator Studio</p>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-black tracking-tight text-white">
            Design a new experience.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-4 text-slate-400 text-lg max-w-xl">
            Configure your event details below. Changes reflect instantly in the live preview.
          </motion.p>
        </div>

        {/* STATUS MESSAGES */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-8">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-sm">
                <AlertCircle size={18} /> <p>{errorMsg}</p>
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-8">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={18} /> <p>Event created successfully! Teleporting to dashboard...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 items-start">
          
          {/* LEFT COLUMN: FORM */}
          <div className="flex-1 w-full space-y-8">
            
            {/* DRAG & DROP UPLOAD */}
            <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-md">
              <h2 className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-6 flex items-center gap-2">
                <ImageIcon size={16} className="text-cyan-400" /> Event Banner
              </h2>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleImageChange(e); }}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative overflow-hidden flex flex-col items-center justify-center w-full h-64 md:h-80 rounded-[1.5rem] border-2 border-dashed cursor-pointer transition-all duration-300
                  ${imagePreview ? 'border-transparent bg-[#0a0a0f]' : isDragging ? 'border-cyan-400 bg-cyan-400/5 scale-[1.02]' : 'border-white/10 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-white/[0.04]'}`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-40" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold text-sm flex items-center gap-2 border border-white/10">
                        <UploadCloud size={16} /> Replace Banner
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${isDragging ? 'bg-cyan-400 text-black scale-110 shadow-[0_0_30px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-slate-400 group-hover:bg-cyan-400/20 group-hover:text-cyan-400'}`}>
                      <UploadCloud size={28} />
                    </div>
                    <p className="font-bold text-lg text-white mb-1">{isDragging ? 'Drop to upload' : 'Click or drag image'}</p>
                    <p className="text-slate-500 text-sm font-medium">High-res PNG or JPG (Max 5MB)</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
              {imagePreview && (
                <button onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} className="mt-4 text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5">
                  <X size={14} /> Remove Banner
                </button>
              )}
            </section>

            {/* EVENT BASICS */}
            <FormSection title="Event Details" icon={<Tag size={16} className="text-violet-400"/>}>
              <Field label="Event Title" required>
                <input type="text" placeholder="E.g., Global Tech Summit 2026" value={form.title} onChange={e => update('title', e.target.value)} className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 focus:bg-white/[0.02] rounded-xl px-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-600 font-medium shadow-inner" />
              </Field>
              <Field label="Description">
                <textarea placeholder="What can attendees expect at this event?" value={form.description} onChange={e => update('description', e.target.value)} className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 focus:bg-white/[0.02] rounded-xl px-4 py-3.5 text-white outline-none transition-all min-h-[120px] resize-y placeholder:text-slate-600 font-medium shadow-inner" />
              </Field>
            </FormSection>

            {/* SCHEDULE */}
            <FormSection title="Schedule" icon={<Calendar size={16} className="text-emerald-400"/>}>
              <Field label="Main Event Date" required>
                <div className="relative flex items-center">
                  <Calendar size={18} className="absolute left-4 text-slate-500 pointer-events-none" />
                  <input type="datetime-local" value={form.eventDate} onChange={e => update('eventDate', e.target.value)} className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl pl-12 pr-4 py-3.5 text-white outline-none transition-all shadow-inner [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100" />
                </div>
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Start Time (Doors Open)">
                  <div className="relative">
                    <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="datetime-local" value={form.startTime} onChange={e => update('startTime', e.target.value)} className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl pl-12 pr-4 py-3.5 text-white outline-none transition-all shadow-inner [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50" />
                  </div>
                </Field>
                <Field label="End Time">
                  <div className="relative">
                    <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="datetime-local" value={form.endTime} onChange={e => update('endTime', e.target.value)} className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl pl-12 pr-4 py-3.5 text-white outline-none transition-all shadow-inner [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50" />
                  </div>
                </Field>
              </div>
            </FormSection>

            {/* LOGISTICS & PRICING */}
            <FormSection title="Logistics & Pricing" icon={<MapPin size={16} className="text-orange-400"/>}>
              <Field label="Location" required>
                 <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="text" placeholder="Venue Name or Virtual Link" value={form.location} onChange={e => update('location', e.target.value)} className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl pl-12 pr-4 py-3.5 text-white outline-none transition-all shadow-inner placeholder:text-slate-600" />
                  </div>
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Capacity (Max Attendees)" required>
                  <div className="relative">
                    <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="number" min="1" placeholder="e.g. 50" value={form.maxParticipants} onChange={e => update('maxParticipants', e.target.value)} className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl pl-12 pr-4 py-3.5 text-white outline-none transition-all shadow-inner placeholder:text-slate-600" />
                  </div>
                </Field>
                <Field label="Entry Fee (INR)">
                  <div className="relative">
                    <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="number" min="0" placeholder="0 for free" value={form.entryFee} onChange={e => update('entryFee', e.target.value)} className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl pl-12 pr-4 py-3.5 text-white outline-none transition-all shadow-inner placeholder:text-slate-600" />
                  </div>
                </Field>
              </div>
            </FormSection>
          </div>

          {/* RIGHT COLUMN: STICKY PREVIEW */}
          <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0 sticky top-28">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 pl-2 flex items-center gap-2">
              <Sparkles size={12} className="text-cyan-400" /> Live Card Preview
            </h3>
            
            {/* The exact GlassCard used in Dashboard */}
            <GlassCard className="h-auto flex flex-col mb-6">
              <div className="h-56 relative w-full overflow-hidden p-3 pb-0">
                <div className="absolute inset-3 bottom-0 rounded-t-[20px] rounded-b-[8px] overflow-hidden z-0 bg-white/[0.02] border border-white/5">
                   {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/20 to-transparent opacity-90" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900/20 to-cyan-900/20 flex flex-col items-center justify-center gap-3">
                       <ImageIcon size={32} className="text-white/10" />
                    </div>
                  )}
                </div>
                
                <div className="relative z-10 flex justify-end p-2">
                  <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider shadow-lg">
                    Preview
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col pt-2">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                  {form.title || 'Untitled Event'}
                </h3>
                <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                  <CalendarDays size={14} className="text-slate-500" /> {formatPreviewDate(form.eventDate)}
                </p>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-sm text-slate-300 font-medium">
                    {form.entryFee === '0' || !form.entryFee ? 'Free Entry' : `₹${form.entryFee}`}
                  </span>
                  <span className="text-sm font-bold text-white flex items-center gap-1 opacity-50 cursor-default">
                    View Details →
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* ACTION BUTTON */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} disabled={loading || uploading || success}
              className="group relative w-full py-4 rounded-xl bg-white text-black font-extrabold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2"
            >
              {uploading ? 'Uploading Assets...' : loading ? 'Deploying Event...' : success ? 'Deployed! 🎉' : 'Publish to Dashboard'}
              {!loading && !uploading && !success && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </motion.button>
            <p className="text-center text-[10px] uppercase tracking-widest font-bold text-slate-600 mt-4">
              Instantly live upon publishing
            </p>
          </div>
          
        </div>
      </main>
    </div>
  );
}

// Clean UI Wrappers
function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white/[0.02] p-6 md:p-8 rounded-[2rem] border border-white/5 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
        <div className="p-2 bg-white/5 rounded-xl border border-white/10">{icon}</div>
        <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-xs font-bold tracking-wide text-slate-400 flex items-center gap-1.5 uppercase">
        {label} {required && <span className="text-cyan-400">*</span>}
      </label>
      {children}
    </div>
  );
}