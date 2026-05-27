'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import api from '@/lib/api'; 
import { 
  Calendar, Wallet, Trophy, Users, LayoutDashboard, 
  ChevronRight, QrCode, Sparkles, BarChart, ShieldCheck, ArrowRight,
  Clock, Search, MapPin, Mail, Flame
} from 'lucide-react';

// --- UTILITY COMPONENTS ---

const FadeIn = ({ children, delay = 0, direction = 'up', className = '' }: { children: React.ReactNode, delay?: number, direction?: 'up' | 'down' | 'left' | 'right', className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }} 
      className={className}
    >
      {children}
    </motion.div>
  );
};

const AnimatedCounter = ({ value }: { value: number }) => {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 50, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (latest >= 1000) {
        setDisplay((latest / 1000).toFixed(1).replace(/\.0$/, '') + 'k');
      } else {
        setDisplay(Math.floor(latest).toString());
      }
    });
  }, [springValue]);

  return <span ref={ref}>{display}</span>;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- MAIN PAGE COMPONENT ---
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [modal, setModal] = useState<'login' | 'register' | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSection, setActiveSection] = useState('');
  const [scrolled, setScrolled] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [featuredHackathon, setFeaturedHackathon] = useState<any>(null);

  // Fallback realistic club names if API data is missing
  const premiumClubs = ["Google Developer Clubs", "ACM Student Chapter", "Finance & Investment Cell", "Turing Society", "Cultural Committee"];

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setIsLoading(true);
        const eventsRes = await api.get('/api/events?limit=6');
        const fetchedEvents = eventsRes.data?.events || eventsRes.data || [];
        setEvents(fetchedEvents);

        const hackathon = fetchedEvents.find((e: any) => e.title.toLowerCase().includes('hackathon')) || fetchedEvents[0];
        setFeaturedHackathon(hackathon);
      } catch (error) {
        console.error("Failed to load landing page data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  // Scroll Spy & Navbar Blur Logic
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = ['discover', 'hackathons', 'features'];
      let current = '';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el && window.scrollY >= el.offsetTop - 200) {
          current = section;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-50 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Global Ambient Glows & Noise */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center opacity-40 mix-blend-screen">
        <div className="w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] absolute top-[-200px]" />
        <div className="w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] absolute top-[40%] right-[-10%]" />
      </div>
      <div className="fixed inset-0 z-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Premium Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 transition-all duration-300 ${scrolled ? 'bg-[#030303]/70 backdrop-blur-xl border-b border-white/5 shadow-sm' : 'bg-transparent border-transparent'}`}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg text-white">Eventara</span>
        </button>
        
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-full px-2 py-1">
          {['discover', 'hackathons', 'features'].map((item) => (
            <button 
              key={item}
              onClick={() => scrollTo(item)} 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${activeSection === item ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setModal('login')} className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden md:block">
            Log in
          </button>
          <button onClick={() => setModal('register')} className="px-5 py-2 text-sm font-semibold text-black bg-white rounded-full hover:scale-105 hover:bg-zinc-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Host Event
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center">
        
        {/* 1. HERO SECTION */}
        <section className="relative w-full max-w-7xl px-6 pt-40 pb-24 md:pt-52 md:pb-32 flex flex-col items-center text-center">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wide text-zinc-300 hover:bg-white/10 transition-colors cursor-default">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              Introducing Eventara
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.05] text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40">
              The modern standard <br className="hidden md:block" /> for campus events.
            </h1>
          </FadeIn>

          <FadeIn delay={0.3} className="max-w-2xl mt-6 md:mt-8">
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed font-light text-balance">
              Discover, host, join, and manage hackathons, workshops, and student events effortlessly. Built for ambitious clubs and curious students.
            </p>
          </FadeIn>

          <FadeIn delay={0.4} className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto">
            <button onClick={() => setModal('register')} className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 text-base font-semibold text-black bg-white rounded-full transition-all overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Get Started <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
            <button onClick={() => scrollTo('discover')} className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">
              Explore Events
            </button>
          </FadeIn>

          {/* Premium Floating Hero Visuals */}
          <div className="relative w-full max-w-5xl h-[420px] mt-20 hidden md:block perspective-1000">
            {/* Center Main Dashboard Mockup */}
            <motion.div 
              initial={{ y: 40, opacity: 0, rotateX: 5 }} 
              animate={{ y: 0, opacity: 1, rotateX: 0 }} 
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 -translate-x-1/2 top-0 w-[640px] h-full bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-t-[2rem] border border-white/10 border-b-0 shadow-[0_-20px_100px_-20px_rgba(79,70,229,0.4)] overflow-hidden flex flex-col"
            >
              <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
                <div className="text-xs font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">dashboard.eventara.io</div>
                <div className="w-10" />
              </div>
              <div className="flex-1 p-8 grid gap-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-[0.15]">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-10 w-10 bg-indigo-500/20 rounded-xl border border-indigo-500/30" />
                  <div className="h-6 w-1/3 bg-white/10 rounded-md" />
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="h-40 w-2/3 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-2xl border border-white/5 shadow-inner" />
                  <div className="h-40 w-1/3 bg-white/[0.03] rounded-2xl border border-white/5" />
                </div>
              </div>
            </motion.div>

            {/* Left Glass Ticket */}
            <motion.div 
              animate={{ y: [0, -12, 0], rotate: [-6, -4, -6] }} 
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[8%] top-24 w-64 p-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="flex justify-between items-start mb-5">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><QrCode size={24} /></div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Admit One</p>
                  <p className="font-mono text-sm font-bold text-zinc-300">#EV-9021</p>
                </div>
              </div>
              <p className="font-bold text-xl leading-tight mb-2 line-clamp-1">{events[0]?.title || "Campus Event '26"}</p>
              <div className="flex items-center justify-between text-xs text-zinc-400 mt-4 pt-4 border-t border-white/10">
                <span className="flex items-center gap-1"><MapPin size={12}/> BMS College</span>
                <span className="flex items-center gap-1"><Clock size={12}/> {events[0] ? formatDate(events[0].eventDate) : "Upcoming"}</span>
              </div>
            </motion.div>

            {/* Right Glass Wallet */}
            <motion.div 
              animate={{ y: [0, 12, 0], rotate: [4, 6, 4] }} 
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[8%] top-32 w-64 p-6 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500/20 text-green-400 rounded-lg"><Wallet size={14}/></div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Wallet</p>
                </div>
                <div className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">ACTIVE</div>
              </div>
              <p className="text-3xl font-black tracking-tight mt-2 text-white">₹1,250<span className="text-base text-zinc-500 font-medium">.00</span></p>
              <div className="mt-5 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "66%" }} transition={{ duration: 1.5, delay: 1 }} className="h-full bg-green-500" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* 2. PROBLEM STATEMENT */}
        <section id="problem" className="w-full max-w-7xl px-6 py-24 border-t border-white/5 relative z-10 bg-[#030303]">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">The end of fragmented campus life.</h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-light">We replaced the chaos of scattered WhatsApp groups, messy spreadsheets, and manual cash collections with a unified operating system.</p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Lost in WhatsApp", desc: "Important event links and updates drown in endless group chats and spam. We unify discovery.", icon: Search, color: "text-blue-400", bg: "bg-blue-400/10" },
              { title: "Messy Registrations", desc: "Organizers juggle Google Forms, manual verification, and chaotic entry gates. We automate it.", icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
              { title: "Disconnected Tools", desc: "Payments, ticketing, and certificates require multiple platforms. We built it all into one.", icon: LayoutDashboard, color: "text-emerald-400", bg: "bg-emerald-400/10" }
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1} direction="up" className="group relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/5 transition-colors ${item.bg} ${item.color}`}>
                  <item.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* 3. ANIMATED STATS SECTION */}
        <section id="stats" className="w-full max-w-7xl px-6 py-20 border-y border-white/5 bg-[#050505]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {[
              { label: "Trusted Clubs", value: 45 },
              { label: "Moments Created", value: 210 },
              { label: "Registrations", value: 15200 },
              { label: "Active Students", value: 8500 }
            ].map((stat, i) => (
              <FadeIn key={i} delay={i * 0.1} className="flex flex-col items-center justify-center text-center group">
                <h4 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 mb-2 group-hover:scale-105 transition-transform">
                  <AnimatedCounter value={stat.value} />+
                </h4>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</p>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* 4. FEATURE SHOWCASE (Bento) */}
        <section id="features" className="w-full max-w-7xl px-6 py-32 bg-[#030303]">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-16 max-w-3xl">
              Everything you need to host, join, and scale campus experiences.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            {/* Ticketing */}
            <FadeIn delay={0.1} className="md:col-span-2 relative p-10 rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black border border-white/5 hover:border-white/10 transition-colors overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 w-full md:w-2/3">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
                  <QrCode size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Instant QR Ticketing</h3>
                <p className="text-zinc-400 leading-relaxed">Say goodbye to manual checking. Students get a secure QR pass directly in their dashboard, organizers scan at the door. Zero friction entry.</p>
              </div>
              <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-[#080808] rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-center transform rotate-12 group-hover:rotate-6 transition-transform duration-700">
                <QrCode size={140} className="text-white/10" />
              </div>
            </FadeIn>

            {/* Wallet */}
            <FadeIn delay={0.2} className="relative p-10 rounded-[2rem] bg-zinc-900 border border-white/5 hover:border-white/10 transition-colors overflow-hidden group">
              <div className="w-12 h-12 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl flex items-center justify-center mb-6">
                <Wallet size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Built-in Wallet</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">One-click secure payments for paid events. Seamless refunds directly back to your Eventara wallet.</p>
            </FadeIn>

            {/* Clubs */}
            <FadeIn delay={0.3} className="relative p-10 rounded-[2rem] bg-zinc-900 border border-white/5 hover:border-white/10 transition-colors overflow-hidden group">
               <div className="w-12 h-12 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Verified Identities</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Official blue-check verification for registered college clubs. Build trust and notify members instantly.</p>
            </FadeIn>

            {/* Analytics */}
            <FadeIn delay={0.4} className="md:col-span-2 relative p-10 rounded-[2rem] bg-zinc-900 border border-white/5 hover:border-white/10 transition-colors overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 w-full md:w-2/3">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                  <BarChart size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Organizer Analytics</h3>
                <p className="text-zinc-400 leading-relaxed">Track real-time page views, registration conversions, revenue flow, and live attendance metrics all from one mission-control dashboard.</p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* 5. PREMIUM HACKATHON SPOTLIGHT */}
        <section id="hackathons" className="w-full relative py-32 overflow-hidden border-y border-white/5 bg-[#030303]">
           <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
           <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030303_100%)] pointer-events-none" />

           <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <FadeIn direction="right">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold uppercase tracking-widest text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Trophy size={14} /> Hackathon Mode
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white">Built for the builders.</h2>
                <p className="text-lg text-zinc-400 mb-8 leading-relaxed font-light">
                  Managing a hackathon is historically a nightmare. We fixed it. From solo registrations and team finding, to live leaderboards and final submissions—Eventara handles the entire lifecycle.
                </p>
                <ul className="space-y-4 mb-10">
                  {['Team Formation & Invites', 'Live Submissions Portal', 'Mentor & Judging Rubrics', 'Automated Certificates'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-300 font-medium text-sm">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* High-End Terminal UI Mockup */}
              <FadeIn direction="left" className="relative h-[480px] w-full bg-[#050505] rounded-[2rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(99,102,241,0.1)] p-6 md:p-8 overflow-hidden hidden md:flex flex-col">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                  <div className="font-bold text-lg text-white tracking-tight line-clamp-1">{featuredHackathon?.title || "CyberPunk 2026 Hackathon"}</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE NOW
                  </div>
                </div>
                
                <div className="space-y-5 flex-1 relative z-10">
                  <div className="bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-white tracking-wide">Team: Neural Ninjas</span>
                      <span className="text-[11px] font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/20">4/4 Members</span>
                    </div>
                    <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-9 h-9 rounded-full bg-zinc-800 border-2 border-[#050505] flex items-center justify-center text-[10px] font-bold text-zinc-500 bg-gradient-to-br from-zinc-800 to-zinc-900">U{i}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5 backdrop-blur-sm">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block flex items-center gap-2">
                       Active Problem Statement <Flame size={12} className="text-orange-400" />
                    </span>
                    <p className="text-sm text-zinc-300 leading-relaxed font-light">Build an AI agent that optimizes campus energy consumption using real-time historical IoT data grids.</p>
                  </div>
                </div>

                {/* Fade out bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent pointer-events-none z-20" />
              </FadeIn>
           </div>
        </section>

        {/* 6. DISCOVERY SECTION (Rich Interactive Cards) */}
        <section id="discover" className="w-full max-w-7xl px-6 py-32 bg-[#030303]">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">Discover what's next.</h2>
              <p className="text-zinc-400 text-lg max-w-xl font-light">Find events that match your vibe. From cutting-edge tech talks to massive cultural fests.</p>
            </FadeIn>
            <FadeIn>
              <button onClick={() => setModal('register')} className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-semibold hover:bg-white/10 hover:text-white text-zinc-300 transition-all flex items-center gap-2">
                View All Events <ArrowRight size={16} />
              </button>
            </FadeIn>
          </div>

          <FadeIn delay={0.2} className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-6 px-6 md:mx-0 md:px-0 mb-6">
            {['All', 'Trending', 'Tech & AI', 'Cultural', 'Sports', 'Workshops', 'Free'].map((filter, i) => (
              <button 
                key={i} 
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold tracking-wide border transition-all ${activeFilter === filter ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'}`}
              >
                {filter}
              </button>
            ))}
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3].map((_, i) => (
                <div key={i} className="w-full h-80 rounded-[1.5rem] bg-white/[0.02] animate-pulse border border-white/5" />
              ))
            ) : events.length > 0 ? (
              events.slice(0, 6).map((event, i) => {
                const realisticClub = premiumClubs[i % premiumClubs.length];
                const isTrending = i === 0 || i === 2;
                const spotsLeft = Math.floor(Math.random() * 50) + 5; // Faux data for visual richness

                return (
                  <FadeIn key={event.id || i} delay={0.1 * i} className="group cursor-pointer flex flex-col bg-white/[0.02] border border-white/5 rounded-[1.5rem] overflow-hidden hover:border-white/15 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                    {/* Thumbnail Area */}
                    <div className="w-full h-48 relative overflow-hidden bg-[#080808] flex items-center justify-center">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="absolute inset-0 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" style={{
                          background: `radial-gradient(circle at top left, ${['#312e81', '#9d174d', '#065f46', '#701a75', '#9a3412', '#1e3a8a'][i % 6]}, #030303)`
                        }} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {isTrending && (
                          <div className="bg-orange-500/20 backdrop-blur-md border border-orange-500/30 text-orange-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                            <Flame size={10} /> Trending
                          </div>
                        )}
                      </div>
                      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-md text-xs font-bold border border-white/20 text-white shadow-lg">
                        {event.entryFee === 0 || event.entryFee === '0' ? 'Free Entry' : `₹${event.entryFee}`}
                      </div>
                    </div>
                    
                    {/* Content Area */}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-indigo-400 transition-colors line-clamp-2">{event.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4 font-medium">
                        <ShieldCheck size={14} className="text-indigo-400" /> 
                        <span>{event.clubName || event.organizer?.name || realisticClub}</span>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Calendar size={14} className="text-zinc-500" /> {formatDate(event.eventDate)}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                           <Users size={14} /> {spotsLeft} spots left
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                );
              })
            ) : (
              <div className="col-span-3 py-12 text-center text-zinc-500 text-sm">
                No events found right now.
              </div>
            )}
          </div>
        </section>

        {/* 7. PREMIUM CTA SECTION */}
        <section className="w-full max-w-7xl px-6 py-24 relative bg-[#030303]">
          <FadeIn className="relative bg-[#050505] border border-white/10 rounded-[2.5rem] p-10 md:p-24 text-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
             {/* Intense Mesh Glow inside CTA */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-indigo-500/20 via-purple-500/5 to-transparent opacity-60 pointer-events-none" />
             
             <h2 className="relative z-10 text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-6 text-white leading-tight">
                READY TO LEVEL UP YOUR <br className="hidden md:block" /> CAMPUS EVENTS?
             </h2>
             <p className="relative z-10 text-lg md:text-xl text-zinc-400 mb-10 font-light">Join the Eventara ecosystem today.</p>
             
             <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto">
                <button onClick={() => setModal('register')} className="flex-1 px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                  Start Hosting
                </button>
                <button onClick={() => scrollTo('discover')} className="flex-1 px-8 py-4 bg-white/[0.03] border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-colors">
                  Explore Events
                </button>
             </div>
          </FadeIn>
        </section>

      </main>

      {/* 8. STARTUP FOOTER */}
      <footer className="w-full border-t border-white/5 bg-[#030303] pt-20 pb-10 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          
          <div className="col-span-2">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="font-bold tracking-tight text-white text-xl">Eventara</span>
            </button>
            <p className="text-sm text-zinc-400 mb-8 max-w-xs leading-relaxed font-light">
              The modern campus operating system. Built to make discovery, ticketing, and hosting effortless for the next generation.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              {[Mail].map((Icon, i) => (
                <a key={i} href={Icon === Mail ? "mailto:hello@eventara.io" : "#"} className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-white tracking-widest text-xs uppercase">Product</h4>
            <ul className="space-y-3 text-sm text-zinc-400 font-medium">
              <li><button onClick={() => scrollTo('discover')} className="hover:text-white transition-colors">Discover</button></li>
              <li><button onClick={() => setModal('register')} className="hover:text-white transition-colors">Host Event</button></li>
              <li><button onClick={() => scrollTo('hackathons')} className="hover:text-white transition-colors">Hackathons</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white tracking-widest text-xs uppercase">Organizers</h4>
            <ul className="space-y-3 text-sm text-zinc-400 font-medium">
              <li><button onClick={() => setModal('login')} className="hover:text-white transition-colors">Dashboard</button></li>
              <li><a href="mailto:hello@eventara.io" className="hover:text-white transition-colors">Verification</a></li>
              <li><a href="mailto:hello@eventara.io" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white tracking-widest text-xs uppercase">Legal</h4>
            <ul className="space-y-3 text-sm text-zinc-400 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-sm text-zinc-500 flex flex-col md:flex-row items-center justify-between font-medium">
          <p>© {new Date().getFullYear()} Eventara • Built in India for students</p>
        </div>
      </footer>

      {/* AUTH MODAL INTEGRATION */}
      <AnimatePresence>
        {modal && (
          <AuthModal
            mode={modal}
            onClose={() => setModal(null)}
            onSwitch={() => setModal(modal === 'login' ? 'register' : 'login')}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}