'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import axios from 'axios';

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'maxParticipants' || name === 'entryFee'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async () => {
    if (!event) return;

    setSaving(true);

    try {
      const { data } = await api.put(`/api/events/${event.id}`, form);
      toast.success('Event updated!');
      onUpdated(data);
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Update failed.');
      } else {
        toast.error('Update failed.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-box"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Edit Event</h2>
              <button onClick={onClose} className="close-btn">
                ✕
              </button>
            </div>

            <div className="modal-body">
              {[
                { label: 'Title', name: 'title', type: 'text' },
                { label: 'Location', name: 'location', type: 'text' },
                { label: 'Date', name: 'eventDate', type: 'date' },
                { label: 'Start Time', name: 'startTime', type: 'time' },
                { label: 'End Time', name: 'endTime', type: 'time' },
                {
                  label: 'Max Participants',
                  name: 'maxParticipants',
                  type: 'number',
                },
                {
                  label: 'Entry Fee (₹)',
                  name: 'entryFee',
                  type: 'number',
                },
              ].map(({ label, name, type }) => (
                <div className="field" key={name}>
                  <label>{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={form[name as keyof Event] ?? ''}
                    onChange={handleChange}
                  />
                </div>
              ))}

              <div className="field">
                <label>Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={form.description ?? ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
      `}</style>
    </AnimatePresence>
  );
}