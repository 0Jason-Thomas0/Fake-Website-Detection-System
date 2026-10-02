import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { predictUrl } from '../api/client'
import ResultCard from '../components/ResultCard'

const EXAMPLE_URLS = [
  { label: 'Google', url: 'https://www.google.com', type: 'legit' },
  { label: 'GitHub', url: 'https://github.com/openai', type: 'legit' },
  { label: 'PayPal Phish', url: 'http://paypal-secure-login.tk/verify', type: 'fake' },
  { label: 'IP-based', url: 'http://192.168.1.1/bank-login/verify', type: 'fake' },
]

export default function Detection() {
  const location = useLocation()
  const inputRef = useRef(null)

  const [url, setUrl]       = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [scanned, setScanned] = useState(false)

  // Pre-fill URL if navigated from home
  useEffect(() => {
    const fromState = location.state?.url
    const fromQuery = new URLSearchParams(location.search).get('url')
    const initial = fromState || fromQuery
    if (initial) {
      setUrl(initial)
      setTimeout(() => handleAnalyze(initial), 200)
    }
  }, [])   // eslint-disable-line

  const handleAnalyze = async (urlOverride) => {
    const target = urlOverride || url
    setError('')
    setResult(null)
    setScanned(false)

    if (!target.trim()) {
      setError('Please enter a URL.')
      return
    }

    setLoading(true)
    try {
      const res = await predictUrl(target.trim())
      setResult(res.data)
      setScanned(true)
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to analyze URL. Is the backend running?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleAnalyze()
  }

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 860 }}>

        {/* Page Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="kicker">URL scanner</div>
          <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>
            Classify one URL
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 540 }}>
            Thirteen lexical features, then the deployed Random Forest. The page behind the link is never fetched.
          </p>
        </div>

        {/* Quick Examples */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
          {EXAMPLE_URLS.map(({ label, url: u, type }) => (
            <button key={u}
              onClick={() => { setUrl(u); handleAnalyze(u) }}
              style={{
                padding: '6px 14px',
                background: 'transparent',
                border: `1px solid ${type === 'fake' ? 'rgba(255,51,102,0.3)' : 'rgba(0,255,136,0.3)'}`,
                borderRadius: 20,
                color: type === 'fake' ? 'var(--red)' : 'var(--green)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              id={`example-${label.toLowerCase().replace(' ', '-')}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
          <form onSubmit={handleSubmit}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 10,
            }}>
              Website URL
            </label>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                ref={inputRef}
                id="detect-url-input"
                className={`url-input ${error ? 'error' : ''}`}
                type="text"
                value={url}
                onChange={e => { setUrl(e.target.value); setError('') }}
                placeholder="https://example.com"
                style={{ flex: 1, minWidth: 200 }}
                disabled={loading}
              />
              <button
                id="detect-analyze-btn"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ minWidth: 160 }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18 }} />
                    Analyzing...
                  </>
                ) : (
                  'Analyze'
                )}
              </button>
            </div>

            {error && (
              <div style={{
                marginTop: 12, padding: '10px 14px',
                background: 'rgba(255,51,102,0.08)',
                border: '1px solid rgba(255,51,102,0.25)',
                borderRadius: 8, color: 'var(--red)',
                fontSize: '0.88rem',
              }}>
                {error}
              </div>
            )}
          </form>

          {/* Loading State */}
          {loading && (
            <div style={{ marginTop: 28, textAlign: 'center' }}>
              {/* Animated scan visualization */}
              <div style={{
                position: 'relative',
                width: 80, height: 80,
                margin: '0 auto 16px',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(0,212,255,0.2)',
                  animation: 'spin 2s linear infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: 8,
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  borderTopColor: 'var(--cyan)',
                  animation: 'spin 1s linear infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--cyan)',
                }}>
                  SCAN
                </div>
              </div>
              <p style={{ color: 'var(--cyan)', fontWeight: 600, marginBottom: 4 }}>Analyzing URL...</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Extracting features and running AI model</p>
            </div>
          )}
        </div>

        {/* Result */}
        {scanned && result && <ResultCard result={result} />}

        {/* How It Works */}
        {!scanned && (
          <div className="glass-card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20 }}>
              HOW IT WORKS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { n: '01', t: 'URL Input', d: 'Enter any HTTP or HTTPS URL you want to analyze' },
                { n: '02', t: 'Feature Extraction', d: '13 URL characteristics extracted automatically' },
                { n: '03', t: 'AI Prediction', d: 'Random Forest model classifies the URL' },
                { n: '04', t: 'Result & Explanation', d: 'Get prediction, confidence score, and risk reasons' },
              ].map(({ n, t, d }) => (
                <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    flexShrink: 0,
                    width: 36, height: 36,
                    background: 'rgba(0,212,255,0.1)',
                    border: '1px solid rgba(0,212,255,0.2)',
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--cyan)',
                    fontWeight: 700,
                  }}>
                    {n}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2, color: 'var(--text-primary)' }}>{t}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
