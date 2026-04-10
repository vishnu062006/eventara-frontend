'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const navLinks = [
    { href: '/dashboard', label: 'Events' },
    ...(user?.role === 'event_admin' || user?.role === 'admin'
      ? [
          { href: '/dashboard/create', label: 'Create Event' },
          { href: '/dashboard/my-events', label: 'My Events' },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [{ href: '/dashboard/admin', label: 'Admin' }]
      : []),
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <motion.button
          onClick={() => router.push('/dashboard')}
          whileHover={{ scale: 1.02 }}
          className="text-xl font-black"
          style={{ color: 'var(--text)' }}
        >
          Event<span style={{ color: 'var(--blue)' }}>ara</span>.
        </motion.button>

        {/* Desktop Nav */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <NavBtn key={link.href} onClick={() => router.push(link.href)}>
                {link.label}
              </NavBtn>
            ))}
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg border flex items-center justify-center"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Hamburger (mobile only) */}
          {user && (
            <button
              className="md:hidden flex flex-col gap-1"
              onClick={() => setMenuOpen(v => !v)}
            >
              <span className="w-5 h-0.5 bg-white" />
              <span className="w-5 h-0.5 bg-white" />
              <span className="w-5 h-0.5 bg-white" />
            </button>
          )}

          {/* Avatar */}
          {user && (
            <div className="relative hidden md:block">
              <motion.button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                whileHover={{ scale: 1.05 }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#d2a8ff] flex items-center justify-center text-[#060910] font-black"
              >
                {getInitials(user.name)}
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-12 w-56 rounded-xl border"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <DropItem onClick={() => router.push('/dashboard/profile')}>
                      👤 Profile
                    </DropItem>
                    <DropItem onClick={() => router.push('/dashboard/registrations')}>
                      🎫 Registrations
                    </DropItem>
                    <DropItem onClick={handleLogout} danger>
                      🚪 Logout
                    </DropItem>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE DRAWER ================= */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              className="fixed right-0 top-0 h-full w-64 p-5 flex flex-col gap-4"
              style={{ background: 'var(--surface)' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-lg">Eventara</span>
                <button onClick={() => setMenuOpen(false)}>✕</button>
              </div>

              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-2 text-sm"
                >
                  {link.label}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                className="mt-auto text-red-400 text-left"
              >
                Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ================= COMPONENTS ================= */

function NavBtn({ children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm rounded-lg"
      style={{ color: 'var(--muted)' }}
    >
      {children}
    </button>
  );
}

function DropItem({ children, onClick, danger }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm"
      style={{ color: danger ? '#f85149' : 'var(--muted)' }}
    >
      {children}
    </button>
  );
}