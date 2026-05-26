'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  Search, SlidersHorizontal, Clock, PlayCircle, Archive, 
  Plus, LayoutGrid, Calendar, MapPin, Users, X,
  ShieldAlert, Star, ArrowRight
} from 'lucide-react';

interface FilterState {
  status: string[];
  type: string[];
  price: string[];
  date: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // --- DATA STATE ---
  const [events, setEvents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [accessRequestStatus, setAccessRequestStatus] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  // --- FILTER UI STATE ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: [], type: [], price: [], date: []
  });

  // --- API CALLS ---
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
  }, [user]);

  // Click outside to close filter
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Application
  useEffect(() => {
    let result = events;
    
    // Search
    if (search) {
      result = result.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(search.toLowerCase())) ||
        (e.clubName && e.clubName.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // Exact Matches
    if (filters.status.length > 0) result = result.filter(e => filters.status.includes(e.status));
    if (filters.type.length > 0) result = result.filter(e => e.category && filters.type.includes(e.category));
    if (filters.price.includes('Free')) result = result.filter(e => e.entryFee === 0 || e.entryFee === '0');
    
    setFiltered(result);
  }, [events, search, filters]);

  // Derived Stats
  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === 'UPCOMING').length,
    ongoing: events.filter((e) => e.status === 'ONGOING').length,
    expired: events.filter((e) => e.status === 'EXPIRED').length,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value) ? prev[category].filter(item => item !== value) : [...prev[category], value]
    }));
  };

  const clearFilters = () => setFilters({ status: [], type: [], price: [], date: [] });
  const activeFilterCount = Object.values(filters).flat().length;

  return (
    <div className="min-h-screen bg-[#0E1116] text-zinc-50 font-sans selection:bg-indigo-500/30 flex flex-col md:flex-row">
      
      {/* Navbar Integration */}
      <Navbar />

      {/* Main Content Area (padding-top adjusted to clear floating navbar smoothly) */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 pt-28 pb-10 md:pt-32 md:pb-12">
        
        {/* 1. HERO HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3 mb-1.5">
              <span className="animate-wave origin-bottom-right">👋</span> {getGreeting()}, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-zinc-400 text-sm font-medium">
              Here's what's happening with your events today.
            </p>
          </div>

          {(user?.role === 'EVENT_ADMIN' || user?.role === 'ADMIN') && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/create')}
              className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] shrink-0"
            >
              <Plus size={18} />
              <span>Create Event</span>
            </motion.button>
          )}
        </motion.div>

        {/* 2. STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Events', value: stats.total, icon: LayoutGrid, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/40', trend: '↑ 12%', sub: 'All time events created' },
            { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', trend: '↑ 8%', sub: 'Starting soon' },
            { label: 'Ongoing', value: stats.ongoing, icon: PlayCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', trend: '— 0%', sub: 'Happening now' },
            { label: 'Expired', value: stats.expired, icon: Archive, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/40', trend: '↓ 5%', sub: 'Completed events' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`rounded-2xl p-5 bg-[#14171E] border ${stat.border} flex items-center gap-4 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-shadow duration-300`}
            >
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
                <stat.icon size={28} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-bold text-white tracking-tight leading-none mb-1">{stat.value}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-300 truncate">{stat.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stat.trend.includes('↑') ? 'bg-emerald-500/10 text-emerald-400' : stat.trend.includes('↓') ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                    {stat.trend}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 truncate">{stat.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3. SEARCH & FILTERS BAR */}
        <div className="relative mb-8" ref={filterRef}>
          <div className="flex flex-col md:flex-row items-center gap-3">
            
            {/* Command-Bar Style Search */}
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search events by name, type, or club..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#14171E] border border-white/10 rounded-xl py-3.5 pl-11 pr-16 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                <span className="bg-white/5 border border-white/10 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded font-mono">⌘</span>
                <span className="bg-white/5 border border-white/10 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded font-mono">K</span>
              </div>
            </div>

            {/* Premium Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`relative flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border transition-all shrink-0 ${
                isFilterOpen || activeFilterCount > 0 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                  : 'bg-[#14171E] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="text-sm font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Chips */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }} 
                className="flex flex-wrap gap-2 mt-4 overflow-hidden"
              >
                {Object.entries(filters).map(([category, values]) => 
                  values.map((val: string) => (
                    <span key={`${category}-${val}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14171E] border border-white/10 text-xs font-medium text-zinc-300">
                      <span className="text-zinc-500 capitalize">{category}:</span> {val}
                      <button onClick={() => toggleFilter(category as keyof FilterState, val)} className="ml-1 hover:text-white transition-colors focus:outline-none">
                        <X size={12}/>
                      </button>
                    </span>
                  ))
                )}
                <button onClick={clearFilters} className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-white transition-colors">
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Filter Popover */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-[65px] w-[320px] sm:w-[400px] p-5 bg-[#14171E] border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50"
              >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                  <h3 className="font-semibold text-white">Filters</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={16}/></button>
                </div>

                <div className="space-y-6">
                  {/* Status Selection */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {['UPCOMING', 'ONGOING', 'EXPIRED'].map(s => (
                        <button key={s} onClick={() => toggleFilter('status', s)} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${filters.status.includes(s) ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/10'}`}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Type Selection */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Event Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['Hackathon', 'Workshop', 'Tech Talk', 'Cultural', 'Sports'].map(type => (
                        <button key={type} onClick={() => toggleFilter('type', type)} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${filters.type.includes(type) ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/10'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Selection */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Price</label>
                    <div className="flex flex-wrap gap-2">
                      {['Free', 'Paid'].map(p => (
                        <button key={p} onClick={() => toggleFilter('price', p)} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${filters.price.includes(p) ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/10'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
                  <button onClick={clearFilters} className="flex-1 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors bg-white/[0.03] rounded-lg">Clear All</button>
                  <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-lg shadow-md">Apply</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <h2 className="text-xl font-bold text-white mb-6">All Events</h2>

        {/* 4. EVENT CARDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#14171E] border border-white/5 h-[360px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 border border-white/5 border-dashed rounded-3xl text-center bg-white/[0.01]"
          >
            <Search className="text-zinc-600 mb-4" size={32} />
            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
            <p className="text-sm text-zinc-500">Try adjusting your search or filters.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((event, i) => {
                // Derived UI Props
                const isUpcoming = event.status === 'UPCOMING';
                const isOngoing = event.status === 'ONGOING';
                const statusColor = isUpcoming ? 'text-emerald-400 bg-emerald-500/20' : isOngoing ? 'text-amber-400 bg-amber-500/20' : 'text-rose-400 bg-rose-500/20';
                const dotColor = isUpcoming ? 'bg-emerald-400' : isOngoing ? 'bg-amber-400' : 'bg-rose-400';
                
                const formattedDate = event.eventDate 
                  ? new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                  : 'TBD';

                return (
                  <motion.div
                    layout
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="group relative bg-[#14171E] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col h-[380px]"
                  >
                    {/* Top Abstract Image Area */}
                    <div className="relative h-44 w-full bg-[#0a0a0c] overflow-hidden">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                      ) : (
                        <div className="absolute inset-0 opacity-70 group-hover:opacity-100 transition-opacity" style={{
                          background: `radial-gradient(ellipse at top left, ${['#312e81', '#831843', '#064e3b', '#4c1d95'][i % 4]}, transparent), radial-gradient(ellipse at bottom right, #000, transparent)`
                        }} />
                      )}
                      
                      {/* Top Overlay Gradients */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#14171E]" />

                      {/* Floating Status Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isOngoing ? 'animate-pulse' : ''}`} />
                        {event.status}
                      </div>

                      <button className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-zinc-400 hover:text-white transition-colors">
                        <Star size={14} />
                      </button>

                      {/* Floating Date Badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-white/5 backdrop-blur-md text-xs font-medium text-zinc-300">
                        <Calendar size={12} className="text-zinc-400" />
                        {formattedDate}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 flex flex-col flex-1 relative z-10">
                      <h3 className="text-lg font-bold text-white tracking-tight mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {event.title}
                      </h3>
                      
                      <p className="text-sm text-zinc-400 line-clamp-2 mb-4 leading-relaxed font-light">
                        {event.description || 'Join us for this amazing campus event.'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-6 font-medium mt-auto">
                        <span className="flex items-center gap-1.5 line-clamp-1 truncate">
                          <MapPin size={14} /> {event.location || 'TBA'}
                        </span>
                        <span className="flex items-center gap-1.5 line-clamp-1 truncate">
                          <ShieldAlert size={14} /> {event.clubName || 'Organizer'}
                        </span>
                      </div>

                      {/* Footer Actions (Ghost Buttons) */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                        <span className="text-sm font-bold text-emerald-400">
                          {event.entryFee === 0 || event.entryFee === '0' ? 'Free' : `₹${event.entryFee}`}
                        </span>
                        
                        <button 
                          onClick={() => router.push(`/dashboard/events/${event.id}`)}
                          className="px-4 py-2 bg-transparent border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

      </main>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          75% { transform: rotate(-10deg); }
        }
        .animate-wave {
          display: inline-block;
          animation: wave 1.5s infinite;
        }
      `}</style>
    </div>
  );
}