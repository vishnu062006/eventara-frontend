'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  Search, SlidersHorizontal, Clock, PlayCircle, Archive, 
  Plus, LayoutGrid, X, CalendarDays, TrendingUp, TrendingDown,
  ChevronRight, Ticket, ArrowUpRight,
  LayoutDashboard,
  Wallet,
  PlusCircle,
  FlameKindling
} from 'lucide-react';

interface FilterState {
  status: string[];
  type: string[];
  price: string[];
  date: string[];
}

// --- Next-Gen Hover Card ---
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

function GlassCard({ children, className, onClick }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 400, damping: 40 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 400, damping: 40 });
  const glareX = useTransform(x, [-0.5, 0.5], ['-20%', '120%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['-20%', '120%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1200 }}
      className={`relative group rounded-[2rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl overflow-hidden transition-all duration-300 hover:bg-white/[0.06] ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
    >
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useTransform(
            [glareX, glareY],
            ([gx, gy]) => `radial-gradient(circle 300px at ${gx} ${gy}, rgba(255,255,255,0.12), transparent)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

// --- Skeleton Loader Component ---
const SkeletonCard = () => (
  <div className="h-[420px] rounded-[2rem] bg-white/[0.02] border border-white/[0.05] overflow-hidden flex flex-col">
    <div className="h-56 p-3 pb-0">
      <div className="w-full h-full bg-white/[0.05] rounded-t-[20px] rounded-b-[8px] animate-pulse" />
    </div>
    <div className="p-6 flex-1 flex flex-col pt-4">
      <div className="h-7 w-3/4 bg-white/[0.05] rounded-lg animate-pulse mb-4" />
      <div className="h-4 w-1/2 bg-white/[0.05] rounded-md animate-pulse mb-6" />
      <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
        <div className="h-5 w-16 bg-white/[0.05] rounded-md animate-pulse" />
        <div className="h-10 w-32 bg-white/[0.05] rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [events, setEvents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Overview' | 'Events' | 'Analytics'>('Overview');
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: [], type: [], price: [], date: []
  });

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  useEffect(() => {
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
    fetchEvents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let result = [...events];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((e) =>
        (e.title && e.title.toLowerCase().includes(s)) ||
        (e.category && e.category.toLowerCase().includes(s))
      );
    }

    if (filters.status.length > 0) {
      result = result.filter(e => filters.status.includes(e.status));
    } else {
      result = result.filter(e => e.status === 'UPCOMING' || e.status === 'ONGOING');
    }

    if (filters.price.includes('Free')) {
      result = result.filter(e => e.entryFee === 0 || e.entryFee === '0');
    }

    result.sort((a, b) => {
      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : Infinity;
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : Infinity;
      return dateA - dateB;
    });

    setFiltered(result);
  }, [events, search, filters]);

  // --- Dynamic Trend Calculation Engine ---
  // Calculates Month-over-Month percentage changes dynamically from the real dataset
  const getTrend = (filterFn: (e: any) => boolean) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const targetEvents = events.filter(filterFn);
    
    // Fallback: If no dates exist in the DB, return 0% to prevent NaN/errors
    if (!targetEvents.some(e => e.eventDate)) return { trend: '0.0%', isPos: null };

    const currentCount = targetEvents.filter(e => e.eventDate && new Date(e.eventDate) >= thirtyDaysAgo).length;
    const previousCount = targetEvents.filter(e => e.eventDate && new Date(e.eventDate) >= sixtyDaysAgo && new Date(e.eventDate) < thirtyDaysAgo).length;

    if (previousCount === 0) return { trend: currentCount > 0 ? '+100%' : '0.0%', isPos: currentCount > 0 ? true : null };
    
    const percentage = ((currentCount - previousCount) / previousCount) * 100;
    return { 
      trend: `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`, 
      isPos: percentage === 0 ? null : percentage > 0 
    };
  };

  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === 'UPCOMING').length,
    ongoing: events.filter((e) => e.status === 'ONGOING').length,
    expired: events.filter((e) => e.status === 'EXPIRED').length,
    trends: {
      total: getTrend(() => true),
      upcoming: getTrend(e => e.status === 'UPCOMING'),
      ongoing: getTrend(e => e.status === 'ONGOING'),
      expired: getTrend(e => e.status === 'EXPIRED'),
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const activeFilterCount = Object.values(filters).flat().length;

  return (
    <div className="min-h-screen bg-[#030305] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative flex flex-col md:flex-row">
      {/* Background Ambient Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 pt-28 pb-10 md:pt-32 flex flex-col min-h-screen">
        
        {/* HERO HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[2px] w-8 bg-gradient-to-r from-cyan-400 to-transparent rounded-full" />
              <p className="text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase flex items-center gap-2">
                <CalendarDays size={14} />
                {todayDate}
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              Good {getGreeting().toLowerCase()}, {user?.name?.split(' ')[0] || 'Guest'}.
            </h1>
            <p className="text-slate-400 font-medium text-lg">
              Here is the latest overview of your active events and analytics.
            </p>
          </div>

          {(user?.role === 'EVENT_ADMIN' || user?.role === 'ADMIN') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard/create')}
              className="group relative flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-black font-bold tracking-wide overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Plus size={20} className="relative z-10 group-hover:text-white transition-colors" />
              <span className="relative z-10 group-hover:text-white transition-colors">Create Event</span>
            </motion.button>
          )}
        </motion.div>

        {/* SAAS TABS NAVIGATION */}
        <div className="flex items-center gap-6 border-b border-white/[0.08] mb-10 overflow-x-auto hide-scrollbar">
          {['Overview', 'Events', 'Analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`relative pb-4 text-sm font-bold tracking-wide transition-colors whitespace-nowrap ${
                activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 rounded-t-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENT: OVERVIEW */}
        <AnimatePresence mode="wait">
          {(activeTab === 'Overview' || activeTab === 'Analytics') && (
            <motion.div
              key="overview-content"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* GLASS STATS WITH DYNAMIC % IMPROVEMENT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { label: 'Total Events', value: stats.total, icon: LayoutDashboard, color: 'text-violet-400', trend: stats.trends.total },
                  { label: 'Upcoming', value: stats.upcoming, icon: CalendarDays, color: 'text-cyan-400', trend: stats.trends.upcoming },
                  { label: 'Live Now', value: stats.ongoing, icon: FlameKindling, color: 'text-emerald-400', trend: stats.trends.ongoing },
                  { label: 'Archived', value: stats.expired, icon: PlusCircle, color: 'text-slate-500', trend: stats.trends.expired },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] backdrop-blur-md hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                      <stat.icon size={20} className={stat.color} />
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-4xl font-black text-white">{stat.value}</div>
                      {stat.trend.isPos !== null && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] ${stat.trend.isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stat.trend.isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {stat.trend.trend}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB CONTENT: EVENTS & OVERVIEW (Grid Section) */}
        <AnimatePresence mode="wait">
          {(activeTab === 'Overview' || activeTab === 'Events') && (
            <motion.div
              key="events-content"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Ticket className="text-violet-400" size={20} /> 
                  {activeTab === 'Overview' ? 'Featured Events' : 'All Events'}
                </h2>
                {activeTab === 'Overview' && (
                  <button 
                    onClick={() => setActiveTab('Events')}
                    className="text-sm font-bold text-cyan-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    View All <ChevronRight size={16} />
                  </button>
                )}
              </div>

              {/* SEARCH & FILTERS */}
              {activeTab === 'Events' && (
                <div className="relative mb-10" ref={filterRef}>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={20} />
                      <input
                        type="text"
                        placeholder="Search events by name or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.1] rounded-2xl py-4 pl-14 pr-6 text-base font-medium text-white placeholder:text-slate-600 focus:outline-none focus:bg-white/[0.06] transition-all backdrop-blur-md"
                      />
                    </div>

                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-md transition-all shrink-0 ${
                        isFilterOpen || activeFilterCount > 0
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/[0.03] border-white/[0.1] text-slate-400 hover:text-white'
                      }`}
                    >
                      <SlidersHorizontal size={20} />
                      <span className="font-medium">Filter</span>
                      {activeFilterCount > 0 && (
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-black text-xs font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-[75px] w-full max-w-sm p-6 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl z-50"
                      >
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-white">Filters</h3>
                          <button onClick={() => setIsFilterOpen(false)} className="text-slate-500 hover:text-white p-1"><X size={20} /></button>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3 block">Status</label>
                            <div className="flex flex-wrap gap-2">
                              {['UPCOMING', 'ONGOING', 'EXPIRED'].map(s => (
                                <button 
                                  key={s} 
                                  onClick={() => toggleFilter('status', s)} 
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filters.status.includes(s) ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                >
                                  {s.charAt(0) + s.slice(1).toLowerCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3 block">Price</label>
                            <div className="flex flex-wrap gap-2">
                              {['Free', 'Paid'].map(p => (
                                <button 
                                  key={p} 
                                  onClick={() => toggleFilter('price', p)} 
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filters.price.includes(p) ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* EVENTS GRID */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 mb-6 rounded-full bg-white/5 flex items-center justify-center">
                    <Search size={32} className="text-slate-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No active events found</h3>
                  <p className="text-slate-500">
                  Try adjusting your search or changing filters to explore other events.
                  </p>
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence>
                    {(activeTab === 'Overview' ? filtered.slice(0, 3) : filtered).map((event, i) => {
                      const isUpcoming = event.status === 'UPCOMING';
                      const isOngoing = event.status === 'ONGOING';
                      
                      const statusBadge = isOngoing
                        ? <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live</span>
                        : isUpcoming 
                        ? <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">Upcoming</span>
                        : <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">Ended</span>;

                      const date = event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD';

                      return (
                        <motion.div
                          layout
                          key={event.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}
                        >
                          <GlassCard className="h-[420px] flex flex-col">
                            <div className="h-56 relative w-full overflow-hidden p-3" onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                              <div className="absolute inset-3 rounded-2xl overflow-hidden z-0 bg-white/[0.02]">
                                 {event.imageUrl ? (
                                  <>
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/20 to-transparent opacity-90" />
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-violet-900/20 to-black/40 flex items-center justify-center">
                                     <CalendarDays size={32} className="text-white/10" />
                                  </div>
                                )}
                              </div>
                              <div className="relative z-10 flex justify-end p-2">
                                {statusBadge}
                              </div>
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col pt-2">
                              <h3 
                                onClick={() => router.push(`/dashboard/events/${event.id}`)}
                                className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors cursor-pointer"
                              >
                                {event.title}
                              </h3>
                              <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                                <CalendarDays size={14} className="text-slate-500" /> 📅 {date}
                              </p>
                              
                              <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-sm text-slate-300 font-medium">
                                  {event.entryFee === 0 || event.entryFee === '0' ? 'Free Entry' : `🎟 ₹${event.entryFee}`}
                                </span>
                                
                                {/* PRIMARY FILLED CTA BUTTON */}
                                <button 
                                  onClick={() => router.push(`/dashboard/events/${event.id}`)}
                                  className="px-5 py-2 rounded-xl bg-white text-black text-xs font-extrabold tracking-wide hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                  Register Now <ArrowUpRight size={14} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                          </GlassCard>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* PROFESSIONAL FOOTER */}
        <footer className="mt-auto pt-16 pb-6 w-full border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p className="font-medium tracking-wide">
            © {new Date().getFullYear()} Eventara. All rights reserved.
          </p>
          <div className="flex items-center gap-8 font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-cyan-400 transition-colors flex items-center gap-2">
               Support <ChevronRight size={14} />
            </a>
          </div>
        </footer>

      </main>
    </div>
  );
}