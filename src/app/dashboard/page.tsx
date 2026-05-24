'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import EventCardSkeleton from '@/components/EventCardSkeleton';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type StatusFilter = 'ALL' | 'UPCOMING' | 'ONGOING' | 'EXPIRED';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [events, setEvents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [status, setStatus] = useState<StatusFilter>('UPCOMING');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [accessRequestStatus, setAccessRequestStatus] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessRequestStatus = async () => {
    try {
      const res = await api.get('/api/access-requests/my-status');
      setAccessRequestStatus(res.data.status || null);
    } catch {
      setAccessRequestStatus(null);
    }
  };

  const handleRequestAccess = async () => {
    setRequestLoading(true);
    try {
      await api.post('/api/access-requests');
      setAccessRequestStatus('PENDING');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Request failed');
    } finally {
      setRequestLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (user?.role === 'STUDENT') fetchAccessRequestStatus();
  }, []);

  useEffect(() => {
    let result = status === 'ALL' ? events : events.filter((e) => e.status === status);
    if (search) {
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [status, events, search]);

  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === 'UPCOMING').length,
    ongoing: events.filter((e) => e.status === 'ONGOING').length,
    expired: events.filter((e) => e.status === 'EXPIRED').length,
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--blue)' }}>
              —{' '}
              {new Date().getHours() < 12
                ? 'Good Morning'
                : new Date().getHours() < 17
                ? 'Good Afternoon'
                : 'Good Evening'}
            </p>
            <h1 className="text-5xl font-black" style={{ color: 'var(--text)' }}>
              Hey, {user?.name.split(' ')[0]} 👋
            </h1>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>

          {(user?.role === 'EVENT_ADMIN' || user?.role === 'ADMIN') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard/create')}
              className="hidden md:flex items-center gap-2 font-black px-6 py-3 rounded-xl transition-colors"
              style={{ background: 'var(--blue)', color: '#060910' }}
            >
              + Create Event
            </motion.button>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Events', value: stats.total, color: 'var(--text)' },
            { label: 'Upcoming', value: stats.upcoming, color: '#3fb950' },
            { label: 'Ongoing', value: stats.ongoing, color: '#e3b341' },
            { label: 'Expired', value: stats.expired, color: '#f85149' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-5 border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="text-4xl font-black" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-sm mt-1 font-medium" style={{ color: 'var(--muted)' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Request Event Admin Access Banner */}
        {user?.role === 'STUDENT' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl border flex items-center justify-between gap-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-white font-bold text-sm">Want to host events?</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {accessRequestStatus === 'PENDING'
                  ? '⏳ Your request is pending admin approval.'
                  : accessRequestStatus === 'REJECTED'
                  ? '❌ Your request was rejected. Contact admin.'
                  : 'Request Event Admin access to start creating events.'}
              </p>
            </div>
            {!accessRequestStatus && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRequestAccess}
                disabled={requestLoading}
                className="whitespace-nowrap font-black text-sm px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
                style={{ background: 'var(--blue)', color: '#060910' }}
              >
                {requestLoading ? '...' : 'Request Access'}
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-style md:max-w-xs"
          />
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'UPCOMING', 'ONGOING', 'EXPIRED'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                style={{
                  background: status === s ? 'var(--blue)' : 'var(--surface)',
                  color: status === s ? '#060910' : 'var(--muted)',
                  borderColor: status === s ? 'var(--blue)' : 'var(--border)',
                }}
              >
                {s === 'ALL' ? '🌐 All' : s === 'UPCOMING' ? '🟢 Upcoming' : s === 'ONGOING' ? '🟡 Ongoing' : '🔴 Expired'}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg" style={{ color: 'var(--muted)' }}>No events found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <EventCard event={event} onRefresh={fetchEvents} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}