'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Event {
  id: number; title: string; description: string; eventDate: string;
  startTime: string; endTime: string; location: string;
  maxParticipants: number; entryFee: number;
}

interface Props {
  event: Event | null;
  onClose: () => void;
  onUpdated: (updated: Event) => void;
}

export default function EditEventModal({ event, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<Partial<Event>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) setForm({ ...event });
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/api/events/${event!.id}`, form);
      toast.success('Event updated!');
      onUpdated(data);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-box"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Edit Event</h2>
              <button onClick={onClose} className="close-btn">✕</button>
            </div>

            <div className="modal-body">
              {[
                { label: 'Title', name: 'title', type: 'text' },
                { label: 'Location', name: 'location', type: 'text' },
                { label: 'Date', name: 'eventDate', type: 'date' },
                { label: 'Start Time', name: 'startTime', type: 'time' },
                { label: 'End Time', name: 'endTime', type: 'time' },
                { label: 'Max Participants', name: 'maxParticipants', type: 'number' },
                { label: 'Entry Fee (₹)', name: 'entryFee', type: 'number' },
              ].map(({ label, name, type }) => (
                <div className="field" key={name}>
                  <label>{label}</label>
                  <input
                    type={type} name={name}
                    value={(form as any)[name] ?? ''}
                    onChange={handleChange}
                  />
                </div>
              ))}
              <div className="field">
                <label>Description</label>
                <textarea name="description" rows={3}
                  value={form.description ?? ''} onChange={handleChange} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-save" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .modal-box {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px 16px; border-bottom: 1px solid var(--border);
        }
        .modal-header h2 { font-size: 18px; font-weight: 600; color: var(--text); margin: 0; }
        .close-btn {
          background: none; border: none; color: var(--muted);
          font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 6px;
          transition: background 0.2s;
        }
        .close-btn:hover { background: var(--surface2); color: var(--text); }
        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 13px; font-weight: 500; color: var(--muted); }
        .field input, .field textarea {
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 8px; padding: 9px 12px; color: var(--text);
          font-size: 14px; outline: none; transition: border-color 0.2s;
          font-family: inherit; resize: vertical;
        }
        .field input:focus, .field textarea:focus { border-color: var(--blue); }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px; border-top: 1px solid var(--border);
        }
        .btn-cancel {
          padding: 9px 18px; border-radius: 8px; border: 1px solid var(--border);
          background: none; color: var(--muted); cursor: pointer; font-size: 14px;
          transition: all 0.2s;
        }
        .btn-cancel:hover { background: var(--surface2); color: var(--text); }
        .btn-save {
          padding: 9px 18px; border-radius: 8px; border: none;
          background: var(--blue); color: #fff; cursor: pointer; font-size: 14px;
          font-weight: 500; transition: opacity 0.2s;
        }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-save:hover:not(:disabled) { opacity: 0.85; }
      `}</style>
    </AnimatePresence>
  );
}