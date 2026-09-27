import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DEMO_URLS = [
  'https://www.google.com',
  'http://paypal-secure-verify.tk/login',
  'https://github.com/openai',
  'http://192.168.1.1/bank/login/verify',
  'https://stackoverflow.com',
]

const FEATURES_INFO = [
  { icon: '🔍', title: 'URL Analysis', desc: 'Inspect 13 URL-based features extracted in milliseconds' },
  { icon: '🤖', title: 'AI Prediction', desc: 'Random Forest model trained on thousands of phishing samples' },
  { icon: '📊', title: 'Confidence Score', desc: 'See exactly how certain the model is about the prediction' },
  { icon: '⚡', title: 'Explainable AI', desc: 'Understand why a site is flagged — not just what' },
  { icon: '📋', title: 'Scan History', desc: 'All scans saved locally for future reference' },
  { icon: '🛡', title: 'Risk Levels', desc: 'Categorized into Low, Medium, and High risk' },
]

const STATS = [
  { value: '95%+', label: 'Accuracy' },
  { value: '13',   label: 'URL Features' },
  { value: '3',    label: 'ML Models' },
  { value: '<2s',  label: 'Prediction Time' },
]

export default function Home() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [demoIdx, setDemoIdx] = useState(0)

  // Cycle through demo URLs
  useEffect(() => {
    const t = setInterval(() => {
      setDemoIdx(i => (i + 1) % DEMO_URLS.length)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) {
      navigate('/detect', { state: { url: url.trim() } })
    }
  }

  return (
    <div style={{ paddingTop: 70 }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '60px 24px',
      }}>
        {/* Background glow orbs */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%',
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '10%',
          width: 350, height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,128,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 800, textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
          <div className="fade-in-up" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: 100,
            marginBottom: 28,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--cyan)',
            letterSpacing: 1,
          }}>
            <span style={{ animation: 'blink 1.5s ease infinite', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
            AI-POWERED CYBERSECURITY TOOL
          </div>

          {/* Heading */}
          <h1 className="fade-in-up anim-delay-1" style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 24,
          }}>
            Detect{' '}
            <span className="gradient-text">Fake Websites</span>
            <br />
            Before They Steal Your Data
          </h1>

          {/* Subtext */}
          <p className="fade-in-up anim-delay-2" style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            maxWidth: 580,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Enter any URL and our AI will analyze it for phishing patterns, suspicious features,
            and security threats — in under 2 seconds.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="fade-in-up anim-delay-3"
            style={{ display: 'flex', gap: 12, maxWidth: 620, margin: '0 auto 20px', flexWrap: 'wrap' }}>
            <input
              className="url-input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={`Try: ${DEMO_URLS[demoIdx]}`}
              style={{ flex: 1, minWidth: 200 }}
              id="hero-url-input"
            />
            <button type="submit" className="btn-primary" id="hero-analyze-btn">
              🔍 Analyze URL
            </button>
          </form>

          {/* Sample URLs */}
          <div className="fade-in-up anim-delay-4" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Try:{' '}
            {['https://google.com', 'http://paypal-login-verify.tk'].map((u, i) => (
              <button key={i}
                onClick={() => navigate('/detect', { state: { url: u } })}
                style={{
                  background: 'none',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 6,
                  padding: '3px 10px',
                  color: 'var(--cyan)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  margin: '0 4px',
                  transition: 'all 0.2s',
                }}
              >
                {u.length > 32 ? u.slice(0, 32) + '…' : u}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px', borderTop: '1px solid rgba(0,212,255,0.06)', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
        <div className="container">
          <div className="grid-4">
            {STATS.map(({ value, label }, i) => (
              <div key={i} className="glass-card stat-card">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>
              <span className="gradient-text">Powerful</span> Protection Features
            </h2>
            <p>Everything you need to stay safe from phishing attacks, powered by AI.</p>
          </div>

          <div className="grid-3">
            {FEATURES_INFO.map(({ icon, title, desc }, i) => (
              <div key={i} className="glass-card fade-in-up" style={{
                padding: 28,
                animationDelay: `${i * 0.1}s`,
                opacity: 0,
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: 16,
                  width: 56, height: 56,
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="glass-card" style={{
            padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(0,128,255,0.03))',
            border: '1px solid rgba(0,212,255,0.2)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 20 }}>🛡️</div>
            <h2 style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: 16,
            }}>
              Ready to Scan a URL?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1.05rem' }}>
              Protect yourself from phishing in seconds. Free, instant, and powered by AI.
            </p>
            <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '16px 40px' }}
              onClick={() => navigate('/detect')} id="cta-scan-btn">
              🔍 Start Scanning →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '30px 24px',
        borderTop: '1px solid rgba(0,212,255,0.06)',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
      }}>
        PhishGuard AI — B.Tech Project | AI & Data Science | Fake Website Detection System
      </footer>
    </div>
  )
}
