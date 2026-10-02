import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getModelInfo } from '../api/client'

const DEMO_URLS = [
  'https://www.google.com',
  'http://paypal-secure-verify.tk/login',
  'https://github.com/openai',
  'http://192.168.1.1/bank/login/verify',
]

const FEATURES_INFO = [
  { idx: '01', title: 'Lexical URL features', desc: 'Thirteen signals from the string itself: length, host shape, HTTPS, IP, bait words.' },
  { idx: '02', title: 'Supervised classifier', desc: 'Random Forest is deployed. Decision Tree and Logistic Regression stay in Lab for comparison.' },
  { idx: '03', title: 'Confidence, not a vibe', desc: 'Each scan returns a probability, a risk band, and the reasons that fired.' },
  { idx: '04', title: 'Readable reasons', desc: 'You see why a URL was flagged — missing TLS, IP host, hyphens, keyword pile-up.' },
  { idx: '05', title: 'Local history', desc: 'Every scan is stored on this machine. Filter, open a report, re-score.' },
  { idx: '06', title: 'No page fetch', desc: 'The target site is never loaded. Classification is URL-only.' },
]

const FALLBACK_STATS = [
  { value: '95%+', label: 'Hold-out accuracy' },
  { value: '13',   label: 'URL features' },
  { value: '3',    label: 'Models trained' },
  { value: '<2s',  label: 'Score time' },
]

export default function Home() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [demoIdx, setDemoIdx] = useState(0)
  const [stats, setStats] = useState(FALLBACK_STATS)

  useEffect(() => {
    Promise.allSettled([getStats(), getModelInfo()]).then(([statsRes, infoRes]) => {
      let accuracy = '95%+'
      if (infoRes.status === 'fulfilled') {
        const payload = infoRes.value.data
        const best = (payload.models || []).find(m => m.name === payload.best_model)
        if (best?.accuracy != null) accuracy = `${Number(best.accuracy).toFixed(1)}%`
      }
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value.data
        setStats([
          { value: accuracy, label: 'Hold-out accuracy' },
          { value: String(s.total ?? 0), label: 'Total scans' },
          { value: String(s.fake ?? 0), label: 'Fake' },
          { value: String(s.legit ?? 0), label: 'Legitimate' },
        ])
        return
      }
      setStats([
        { value: accuracy, label: 'Hold-out accuracy' },
        ...FALLBACK_STATS.slice(1),
      ])
    })
  }, [])

  useEffect(() => {
    const t = setInterval(() => setDemoIdx(i => (i + 1) % DEMO_URLS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) navigate('/detect', { state: { url: url.trim() } })
  }

  return (
    <div style={{ paddingTop: 64 }}>
      <section style={{ padding: '72px 24px 48px' }}>
        <div className="container hero-split" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)',
          gap: 48,
          alignItems: 'center',
        }}>
          <div>
            <div className="kicker">URL-only phishing classifier</div>
            <h1 style={{
              fontSize: 'clamp(2.1rem, 4.5vw, 3.3rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: 18,
            }}>
              Score a URL<br />
              <span className="gradient-text">before you open it</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, marginBottom: 28, fontSize: '1.02rem' }}>
              Paste a link. The model reads 13 lexical features and returns Fake or Legitimate,
              with confidence and the rules that fired. The destination page is never fetched.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['https://google.com', 'http://paypal-login-verify.tk'].map(u => (
                <button
                  key={u}
                  onClick={() => navigate('/detect', { state: { url: u } })}
                  className="btn-secondary"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '6px 10px' }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Console
            </div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              URL to classify
            </label>
            <input
              className="url-input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={DEMO_URLS[demoIdx]}
              id="hero-url-input"
              style={{ marginBottom: 12 }}
            />
            <button type="submit" className="btn-primary" id="hero-analyze-btn" style={{ width: '100%' }}>
              Analyze URL
            </button>
          </form>
        </div>
      </section>

      <section style={{ padding: '8px 24px 48px' }}>
        <div className="container">
          <div className="grid-4">
            {stats.map(({ value, label }, i) => (
              <div key={i} className="glass-card stat-card">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>What you get from a scan</h2>
            <p>A classifier on the URL string — not a generic “AI security” landing page.</p>
          </div>
          <div className="grid-3">
            {FEATURES_INFO.map(({ idx, title, desc }) => (
              <div key={idx} className="glass-card" style={{ padding: 22 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--cyan)', marginBottom: 12 }}>
                  {idx}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 80px' }}>
        <div className="container">
          <div className="glass-card" style={{ padding: '36px 32px', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>Run a live score</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 460 }}>
                Open the scanner, or drop several URLs in Batch. Lab compares the three trained models on one link.
              </p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/detect')} id="cta-scan-btn">
              Open scanner
            </button>
          </div>
        </div>
      </section>

      <footer style={{
        padding: '22px 24px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        letterSpacing: '0.06em',
      }}>
        <div className="container">PhishGuard · lexical URL classifier · local scans only</div>
      </footer>

      <style>{`
        @media (max-width: 860px) {
          .hero-split { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
