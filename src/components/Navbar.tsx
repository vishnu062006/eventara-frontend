'use client';

import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const navLinks = [
    { href: '/dashboard', label: 'Events', icon: '◈' },
    { href: '/dashboard/wallet', label: 'Wallet', icon: '◎' },
    ...(user?.role === 'event_admin' || user?.role === 'admin'
      ? [
          { href: '/dashboard/create', label: 'Create', icon: '⊕' },
          { href: '/dashboard/my-events', label: 'My Events', icon: '◉' },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [{ href: '/dashboard/admin', label: 'Admin', icon: '⊛' }]
      : []),
  ];

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .nav-root {
          font-family: 'DM Sans', sans-serif;
        }
        .nav-brand {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 20px;
          letter-spacing: -0.04em;
          color: var(--text);
          background: none;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
          padding: 0;
        }
        .nav-brand:hover { opacity: 0.75; }
        .nav-brand span {
          background: linear-gradient(135deg, #58a6ff, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          text-decoration: none;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }
        .nav-link:hover {
          color: var(--text);
          background: var(--surface2);
        }
        .nav-link.active {
          color: var(--text);
          background: rgba(88, 166, 255, 0.08);
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: linear-gradient(90deg, #58a6ff, #a78bfa);
          border-radius: 2px;
        }
        .nav-link-icon {
          font-size: 11px;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        .nav-link:hover .nav-link-icon,
        .nav-link.active .nav-link-icon {
          opacity: 1;
        }

        .theme-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: border-color 0.2s, transform 0.15s;
          color: var(--text);
        }
        .theme-btn:hover {
          border-color: rgba(88,166,255,0.4);
          transform: rotate(15deg);
        }

        .avatar-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #58a6ff 0%, #a78bfa 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 800;
          color: #060910;
          transition: transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 0 0 rgba(88,166,255,0);
        }
        .avatar-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 16px rgba(88,166,255,0.35);
        }

        .dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          width: 220px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(88,166,255,0.06);
          padding: 6px;
          z-index: 100;
        }
        .drop-header {
          padding: 10px 12px 8px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 4px;
        }
        .drop-name {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
        }
        .drop-email {
          font-size: 11px;
          color: var(--muted);
          margin-top: 1px;
        }
        .drop-item {
          width: 100%;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .drop-item:hover {
          background: var(--surface2);
          color: var(--text);
        }
        .drop-item.danger { color: #f85149; }
        .drop-item.danger:hover {
          background: rgba(248,81,73,0.08);
          color: #f85149;
        }
        .drop-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }
        .drop-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .hamburger:hover { background: var(--surface2); }
        .h-bar {
          width: 18px;
          height: 1.5px;
          background: var(--text);
          border-radius: 2px;
          transition: transform 0.2s, opacity 0.2s, width 0.2s;
        }
        .hamburger.open .h-bar:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
        .hamburger.open .h-bar:nth-child(2) { opacity: 0; }
        .hamburger.open .h-bar:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }

        .mobile-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .mobile-link:hover, .mobile-link.active {
          background: var(--surface2);
          color: var(--text);
        }
        .mobile-link-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }
      `}</style>

      <nav
        className="nav-root fixed top-0 left-0 right-0 z-40 border-b"
        style={{
          background: scrolled ? 'var(--surface)' : 'rgba(6,9,16,0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: scrolled ? 'var(--border)' : 'transparent',
          transition: 'all 0.3s ease',
          boxShadow: scrolled ? '0 1px 0 rgba(88,166,255,0.06)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <button className="nav-brand" onClick={() => router.push('/dashboard')}>
            Event<span>ara</span>
          </button>

          {/* Desktop Nav */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hidden md:flex">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={`nav-link ${isActive(link.href) ? 'active' : ''}`}
                >
                  <span className="nav-link-icon">{link.icon}</span>
                  {link.label}
                </button>
              ))}
            </div>
          )}

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="theme-btn" onClick={toggle}>
              {dark ? '○' : '●'}
            </button>

            {/* Hamburger mobile */}
            {user && (
              <button
                className={`hamburger md:hidden ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="h-bar" />
                <span className="h-bar" />
                <span className="h-bar" />
              </button>
            )}

            {/* Avatar + Dropdown */}
            {user && (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  className="avatar-btn"
                  onClick={() => setDropdownOpen((v) => !v)}
                >
                  {getInitials(user.name)}
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      className="dropdown"
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="drop-header">
                        <div className="drop-name">{user.name}</div>
                        <div className="drop-email">{user.email}</div>
                      </div>

                      {[
                        { icon: '👤', label: 'Profile', href: '/dashboard/profile' },
                        { icon: '🎫', label: 'My Registrations', href: '/dashboard/registrations' },
                        { icon: '💳', label: 'Wallet', href: '/dashboard/wallet' },
                      ].map(({ icon, label, href }) => (
                        <button
                          key={href}
                          className="drop-item"
                          onClick={() => { router.push(href); setDropdownOpen(false); }}
                        >
                          <span className="drop-icon">{icon}</span>
                          {label}
                        </button>
                      ))}

                      <div className="drop-divider" />

                      <button className="drop-item danger" onClick={handleLogout}>
                        <span className="drop-icon">🚪</span>
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 50 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
                background: 'var(--surface)', borderLeft: '1px solid var(--border)',
                zIndex: 60, padding: 20, display: 'flex', flexDirection: 'column', gap: 4,
                fontFamily: "'DM Sans', sans-serif",
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
                  Event<span style={{ background: 'linear-gradient(135deg,#58a6ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ara</span>
                </span>
                <button onClick={() => setMenuOpen(false)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--muted)', fontSize: 14 }}>✕</button>
              </div>

              {/* User info */}
              {user && (
                <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{user.role}</div>
                </div>
              )}

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`mobile-link ${isActive(link.href) ? 'active' : ''}`}
                >
                  <span className="mobile-link-icon">{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              <div style={{ marginTop: 'auto' }}>
                <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(248,81,73,0.2)', background: 'rgba(248,81,73,0.06)', color: '#f85149', cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  🚪 Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}