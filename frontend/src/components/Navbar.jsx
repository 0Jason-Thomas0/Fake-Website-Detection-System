import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/',        label: 'Home',       icon: '⌂' },
  { to: '/detect',  label: 'Detect',     icon: '🔍' },
  { to: '/history', label: 'History',    icon: '📋' },
  { to: '/about',   label: 'About',      icon: 'ℹ' },
]

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
      background: scrolled
        ? 'rgba(6,13,31,0.95)'
        : 'rgba(6,13,31,0.7)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,212,255,0.1)',
      transition: 'all 0.3s ease',
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 70,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #00d4ff, #0080ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
            boxShadow: '0 0 20px rgba(0,212,255,0.4)',
          }}>
            🛡
          </div>
          <div>
            <div style={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#e8f4fd',
              letterSpacing: 1,
            }}>
              PHISHGUARD <span style={{ color: '#00d4ff' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#4a6a8a', letterSpacing: 2, textTransform: 'uppercase' }}>
              Fake Website Detector
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="desktop-nav">
          {NAV_LINKS.map(({ to, label }) => {
            const active = location.pathname === to
            return (
              <Link key={to} to={to} style={{
                padding: '8px 18px',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                color: active ? '#00d4ff' : '#7fa8c9',
                background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
                border: active ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
              }}>
                {label}
              </Link>
            )
          })}

          <Link to="/detect" style={{
            marginLeft: 12,
            padding: '9px 20px',
            background: 'linear-gradient(135deg, #00d4ff, #0080ff)',
            color: '#060d1f',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: 8,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 15px rgba(0,212,255,0.3)',
          }}>
            Scan URL →
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: '1px solid rgba(0,212,255,0.3)',
            color: '#00d4ff',
            padding: '8px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '1.2rem',
          }}
          className="hamburger"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(6,13,31,0.98)',
          borderTop: '1px solid rgba(0,212,255,0.1)',
          padding: '16px 24px 24px',
        }}>
          {NAV_LINKS.map(({ to, label, icon }) => (
            <Link key={to} to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 0',
                textDecoration: 'none',
                color: location.pathname === to ? '#00d4ff' : '#7fa8c9',
                fontWeight: 600,
                borderBottom: '1px solid rgba(0,212,255,0.05)',
              }}>
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
