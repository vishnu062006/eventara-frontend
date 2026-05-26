'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Calendar, Clock, MapPin, Users, UploadCloud, Image as ImageIcon, IndianRupee, Tag, Info, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function CreateEvent() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PRESERVED: State exactly as it was.
  const [form, setForm] = useState({
    title: '', description: '', eventDate: '',
    startTime: '', endTime: '', location: '',
    maxParticipants: '', entryFee: '0',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // PRESERVED: Status logic exactly as it was.
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user || (user.role !== 'EVENT_ADMIN' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <div className="text-center max-w-md mx-auto p-8 border border-[var(--border)] bg-[var(--surface)] rounded-3xl shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="font-black text-3xl mb-3 tracking-tight">Access Denied</h2>
          <p className="text-[var(--muted)] text-lg">Only Event Admins and System Admins can access the creation studio.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-8 px-6 py-3 bg-[var(--surface2)] hover:bg-[var(--border)] transition-colors rounded-xl font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // PRESERVED: Image change logic
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | undefined;
    
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files?.[0];
    } else {
      file = e.target.files?.[0];
    }

    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { 
      setErrorMsg('Image must be under 5MB'); 
      setTimeout(() => setErrorMsg(null), 3000);
      return; 
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // PRESERVED: Upload logic
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
      setErrorMsg('Image upload failed. Event will be created without image.');
      setTimeout(() => setErrorMsg(null), 4000);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // PRESERVED: Submit logic
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

  // Helper for live preview formatting
  const formatPreviewDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] pb-24 selection:bg-[var(--blue)] selection:text-black">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-28 lg:pt-36">
        
        {/* Header Section */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-3">
            <div className="h-[1px] w-8 bg-[var(--blue)]" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--blue)]">Event Studio</p>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-black tracking-tight">
            Design a new experience.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-4 text-[var(--muted)] text-lg max-w-xl">
            Create and publish your event. Changes are reflected in the live preview instantly.
          </motion.p>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-8">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-medium">
                <AlertCircle size={18} />
                <p>{errorMsg}</p>
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-8">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-medium">
                <CheckCircle2 size={18} />
                <p>Event created successfully! Redirecting you...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: FORM */}
          <div className="flex-1 w-full space-y-12">
            
            {/* Visual Upload Area */}
            <section>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><ImageIcon size={20} className="text-[var(--blue)]" /> Cover Artwork</h2>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleImageChange(e); }}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative overflow-hidden flex flex-col items-center justify-center w-full h-64 md:h-80 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300
                  ${imagePreview ? 'border-transparent bg-[var(--surface)] shadow-2xl' : isDragging ? 'border-[var(--blue)] bg-[var(--blue)]/5' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--blue)] hover:bg-[var(--surface2)]'}`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Event Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-white/20 px-6 py-3 rounded-full text-white font-medium flex items-center gap-2">
                        <UploadCloud size={18} /> Replace Image
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 flex flex-col items-center">
                    <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-[var(--blue)] text-black' : 'bg-[var(--surface2)] text-[var(--muted)] group-hover:bg-[var(--blue)] group-hover:text-black'}`}>
                      <UploadCloud size={32} />
                    </div>
                    <p className="font-semibold text-lg mb-1">{isDragging ? 'Drop it here!' : 'Click or drag to upload'}</p>
                    <p className="text-[var(--muted)] text-sm">PNG, JPG up to 5MB. 16:9 recommended.</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
              {imagePreview && (
                <button onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} className="mt-4 text-sm text-red-500 hover:text-red-400 font-medium transition-colors flex items-center gap-2 px-2">
                  ✕ Remove image
                </button>
              )}
            </section>

            {/* FORM SECTIONS */}
            <div className="space-y-8">
              
              {/* Event Basics */}
              <FormSection title="Event Basics" icon={<Tag size={20} className="text-[var(--blue)]"/>}>
                <Field label="Event Title" required>
                  <input type="text" placeholder="E.g., Global Tech Summit 2026" value={form.title} onChange={e => update('title', e.target.value)} className="w-full bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)] rounded-xl px-4 py-3.5 text-base outline-none transition-all placeholder:text-[var(--muted)]/50" />
                </Field>
                <Field label="Description">
                  <textarea placeholder="What is this event about? What can attendees expect?" value={form.description} onChange={e => update('description', e.target.value)} className="w-full bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)] rounded-xl px-4 py-3.5 text-base outline-none transition-all min-h-[120px] resize-y placeholder:text-[var(--muted)]/50" />
                </Field>
              </FormSection>

              {/* Schedule */}
              <FormSection title="Schedule" icon={<Calendar size={20} className="text-[var(--blue)]"/>}>
                <div className="p-5 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl mb-4">
                  <Field label="Main Event Date & Time" required>
                    <div className="relative flex items-center mt-2">
                      <Calendar size={18} className="absolute left-4 text-[var(--muted)] pointer-events-none" />
                      <input type="datetime-local" value={form.eventDate} onChange={e => update('eventDate', e.target.value)} className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--blue)] rounded-xl pl-12 pr-4 py-3 text-base outline-none transition-all [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                      <div className="absolute right-4 pointer-events-none text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded text-xs border border-[var(--border)]">Pick</div>
                    </div>
                  </Field>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Doors Open (Start Time)">
                    <div className="relative">
                      <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                      <input type="datetime-local" value={form.startTime} onChange={e => update('startTime', e.target.value)} className="w-full bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--blue)] rounded-xl pl-12 pr-4 py-3 text-base outline-none transition-all [&::-webkit-calendar-picker-indicator]:opacity-50" />
                    </div>
                  </Field>
                  <Field label="Estimated End Time">
                    <div className="relative">
                      <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                      <input type="datetime-local" value={form.endTime} onChange={e => update('endTime', e.target.value)} className="w-full bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--blue)] rounded-xl pl-12 pr-4 py-3 text-base outline-none transition-all [&::-webkit-calendar-picker-indicator]:opacity-50" />
                    </div>
                  </Field>
                </div>
              </FormSection>

              {/* Location & Attendance */}
              <FormSection title="Logistics & Pricing" icon={<MapPin size={20} className="text-[var(--blue)]"/>}>
                <Field label="Location" required>
                   <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                      <input type="text" placeholder="Venue Name, City or Virtual Link" value={form.location} onChange={e => update('location', e.target.value)} className="w-full bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--blue)] rounded-xl pl-12 pr-4 py-3 text-base outline-none transition-all" />
                    </div>
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Max Participants" required>
                    <div className="relative">
                      <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                      <input type="number" min="1" placeholder="e.g. 50" value={form.maxParticipants} onChange={e => update('maxParticipants', e.target.value)} className="w-full bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--blue)] rounded-xl pl-12 pr-4 py-3 text-base outline-none transition-all" />
                    </div>
                  </Field>
                  <Field label="Entry Fee">
                    <div className="relative">
                      <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                      <input type="number" min="0" placeholder="0 for free" value={form.entryFee} onChange={e => update('entryFee', e.target.value)} className="w-full bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--blue)] rounded-xl pl-12 pr-4 py-3 text-base outline-none transition-all" />
                    </div>
                  </Field>
                </div>
              </FormSection>

            </div>
          </div>

          {/* RIGHT COLUMN: STICKY PREVIEW */}
          <div className="w-full lg:w-[420px] shrink-0 sticky top-28">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4 pl-2 flex items-center gap-2">
              <Info size={14} /> Live Preview
            </h3>
            
            <motion.div 
              layout
              className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl transition-all"
            >
              {/* Preview Image */}
              <div className="h-48 w-full bg-[var(--surface2)] relative border-b border-[var(--border)]">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="text-[var(--muted)] opacity-30" size={48} />
                  </div>
                )}
                
                {/* Floating Fee Badge */}
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                  {form.entryFee === '0' || !form.entryFee ? 'FREE' : `₹${form.entryFee}`}
                </div>
              </div>

              {/* Preview Details */}
              <div className="p-6">
                <h4 className="text-2xl font-bold mb-4 leading-tight text-balance break-words">
                  {form.title || 'Untitled Event'}
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-[var(--surface2)] p-2 rounded-lg text-[var(--blue)] border border-[var(--border)]">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{formatPreviewDate(form.eventDate)}</p>
                      {(form.startTime || form.endTime) && (
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {form.startTime ? formatPreviewDate(form.startTime).split(',')[2] : ''} 
                          {form.endTime ? ` - ${formatPreviewDate(form.endTime).split(',')[2]}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-[var(--surface2)] p-2 rounded-lg text-[var(--blue)] border border-[var(--border)]">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm break-words">{form.location || 'Location TBA'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-[var(--surface2)] p-2 rounded-lg text-[var(--blue)] border border-[var(--border)]">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {form.maxParticipants ? `${form.maxParticipants} Spots Total` : 'Unlimited Capacity'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Submission Area Container */}
            <div className="mt-8 pt-8 border-t border-[var(--border)]">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading || uploading || success}
                className="group relative w-full flex items-center justify-center gap-2 bg-[var(--text)] text-[var(--bg)] p-4 rounded-2xl font-bold text-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_-10px_var(--text)] transition-all hover:shadow-[0_0_60px_-10px_var(--text)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {uploading ? 'Processing Assets...' : loading ? 'Publishing Event...' : success ? 'Published! 🎉' : 'Publish Event'}
                  {!loading && !uploading && !success && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </span>
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]" />
              </motion.button>
              <p className="text-center text-xs text-[var(--muted)] mt-4">
                By publishing, this event will be immediately visible to your audience.
              </p>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

// Minimal UI helpers to keep markup clean
function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--surface)] p-6 md:p-8 rounded-3xl border border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">{icon}</div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold flex items-center gap-1.5">
        {label}
        {required && <span className="text-[var(--blue)]">*</span>}
      </label>
      {children}
    </div>
  );
}