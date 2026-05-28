'use client';

import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Compass, Wallet, PlusCircle, ShieldCheck, 
  User as UserIcon, Ticket, LogOut, Sun, Moon, 
  Menu, X, ChevronDown 
} from 'lucide-react';

/* ================= THEME ================= */
const ThemeContext = createContext({ dark: true, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') setDark(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    if (dark) document.documentElement.classList.remove('light');
    else document.documentElement.classList.add('light');
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ================= NAVBAR ================= */
export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll effect for Glassmorphism
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const navLinks = [
    { href: '/dashboard', label: 'Explore', icon: Compass },
    { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
    ...(user?.role === 'EVENT_ADMIN' || user?.role === 'ADMIN'
      ? [{ href: '/dashboard/create', label: 'Studio', icon: PlusCircle }] : []),
    ...(user?.role === 'ADMIN'
      ? [{ href: '/dashboard/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 font-sans ${
        scrolled 
          ? 'bg-[#030305]/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-3' 
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/dashboard" className="group flex items-center gap-1">
          <span className="font-black text-2xl tracking-tight text-white transition-transform group-hover:scale-105">
            Event<span className="bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">ara</span>
          </span>
        </Link>

        {/* DESKTOP NAV LINKS */}
        {user && (
          <div className="hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    active ? 'text-cyan-400 bg-cyan-400/10 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-cyan-400' : 'opacity-70'} />
                  <span>{link.label}</span>
                  
                  {/* Fluid Active Indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-4 right-4 h-[2px] bg-cyan-400 rounded-t-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-3">

          {/* Mobile Hamburger */}
          {user && (
            <button
              className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
          )}

          {/* Desktop User Dropdown */}
          {user && (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                className="group flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all shadow-sm"
                onClick={() => setDropdownOpen((v) => !v)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xs font-black text-[#030305] shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-shadow">
                  {getInitials(user.name)}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute right-0 top-calc(100% + 12px) mt-3 w-64 bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(88,166,255,0.1)] p-2 z-50 overflow-hidden"
                  >
                    {/* Inner Ambient Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 blur-[40px] pointer-events-none" />
                    
                    <div className="p-4 border-b border-white/5 mb-2 relative z-10">
                      <div className="font-black text-white text-base truncate">{user.name}</div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{user.email}</div>
                    </div>

                    <div className="flex flex-col gap-1 relative z-10">
                      {[
                        { icon: UserIcon, label: 'My Profile', href: '/dashboard/profile' },
                        { icon: Ticket, label: 'Registrations', href: '/dashboard/registrations' },
                        { icon: Wallet, label: 'Wallet Balance', href: '/dashboard/wallet' },
                      ].map(({ icon: Icon, label, href }) => (
                        <button
                          key={href}
                          onClick={() => { router.push(href); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-400/10 transition-colors border border-white/5">
                            <Icon size={14} />
                          </div>
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="h-px bg-white/5 my-2 relative z-10" />

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:shadow-[inset_0_0_15px_rgba(244,63,94,0.1)] transition-all relative z-10 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 transition-colors border border-rose-500/20">
                        <LogOut size={14} />
                      </div>
                      Sign out securely
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-[#060910]/95 backdrop-blur-3xl border-l border-white/10 z-[70] p-6 flex flex-col shadow-2xl"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-6">
                <span className="font-black text-xl tracking-tight text-white">
                  Event<span className="bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">ara</span>
                </span>
                <button 
                  onClick={() => setMenuOpen(false)} 
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {user && (
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
                  <div className="font-black text-white text-lg">{user.name}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mt-1">{user.role.replace('_', ' ')}</div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {[...navLinks, { href: '/dashboard/profile', label: 'My Profile', icon: UserIcon }, { href: '/dashboard/registrations', label: 'Registrations', icon: Ticket }].map((link) => {
                  const active = isActive(link.href);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                        active ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${active ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                        <Icon size={18} />
                      </div>
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto pt-6 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 font-bold text-sm hover:bg-rose-500/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <LogOut size={18} />
                  </div>
                  Sign Out Securely
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </nav>
  );
}