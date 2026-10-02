import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/',          label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/batch',     label: 'Batch' },
  { to: '/lab',       label: 'Lab' },
  { to: '/history',   label: 'History' },
  { to: '/about',     label: 'About' },
]

function isActivePath(pathname, to) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 18 L14 7 L22 18" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.5 18 H18.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      background: scrolled ? 'rgba(7,9,14,0.94)' : 'rgba(7,9,14,0.72)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--cyan)' }}>
          <Mark />
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              letterSpacing: '0.12em',
            }}>
              PHISHGUARD
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              URL classifier
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }} className="desktop-nav">
          {NAV_LINKS.map(({ to, label }) => {
            const active = isActivePath(location.pathname, to)
            return (
              <Link key={to} to={to} style={{
                padding: '7px 11px',
                borderRadius: 3,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: active ? 'var(--cyan)' : 'var(--text-secondary)',
                background: active ? 'rgba(62,224,197,0.08)' : 'transparent',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
              }}>
                {label}
              </Link>
            )
          })}
          <Link to="/detect" className="btn-primary" style={{ marginLeft: 10, padding: '8px 14px', fontSize: '0.78rem' }}>
            Scan URL
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--cyan)',
            padding: '7px 10px',
            borderRadius: 3,
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
          className="hamburger"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {menuOpen && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0 16px' }}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px 0',
                textDecoration: 'none',
                color: isActivePath(location.pathname, to) ? 'var(--cyan)' : 'var(--text-secondary)',
                fontWeight: 600,
                borderBottom: '1px solid rgba(62,224,197,0.06)',
              }}>
              {label}
            </Link>
          ))}
          <Link to="/detect" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ marginTop: 12 }}>
            Scan URL
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
