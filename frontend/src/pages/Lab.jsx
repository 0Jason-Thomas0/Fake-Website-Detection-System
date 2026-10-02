import { useEffect, useState } from 'react'
import { compareModels, getModelInfo } from '../api/client'
import RiskBadge from '../components/RiskBadge'

const EXAMPLE_URLS = [
  { label: 'Google', url: 'https://www.google.com', type: 'legit' },
  { label: 'PayPal Phish', url: 'http://paypal-secure-login.tk/verify', type: 'fake' },
]

const STAGES = [
  'Extracting 13 URL features…',
  'Scoring Random Forest…',
  'Scoring Decision Tree…',
  'Scoring Logistic Regression…',
]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function pickWinner(models, deployedName) {
  if (!models?.length) return null
  return [...models].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence
    if (a.name === deployedName) return -1
    if (b.name === deployedName) return 1
    return 0
  })[0].name
}

export default function Lab() {
  const [url, setUrl] = useState('')
  const [data, setData] = useState(null)
  const [visible, setVisible] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [deployed, setDeployed] = useState('Random Forest')

  useEffect(() => {
    getModelInfo()
      .then(res => {
        if (res.data?.best_model) setDeployed(res.data.best_model)
      })
      .catch(() => {})
  }, [])

  const runCompare = async (target) => {
    const value = (target || url).trim()
    setError('')
    setData(null)
    setVisible(0)
    if (!value) {
      setError('Please enter a URL.')
      return
    }
    setLoading(true)
    try {
      for (const label of STAGES) {
        setStage(label)
        await sleep(420)
      }
      const res = await compareModels(value)
      setData(res.data)
      setVisible(1)
    } catch (err) {
      setError(err.response?.data?.error || 'Compare failed. Is the backend running?')
    } finally {
      setLoading(false)
      setStage('')
    }
  }

  useEffect(() => {
    if (!data?.models || visible >= data.models.length) return
    const t = setTimeout(() => setVisible(n => n + 1), 280)
    return () => clearTimeout(t)
  }, [data, visible])

  const winnerName = pickWinner(data?.models, deployed)
  const shown = data?.models?.slice(0, visible) || []
  const fakeVotes = data?.models?.filter(m => m.prediction === 'Fake').length || 0
  const totalVotes = data?.models?.length || 0

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 1040 }}>
        <div style={{ marginBottom: 36 }}>
          <div className="kicker">Model lab</div>
          <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>
            Compare three models
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto' }}>
            Same URL, three classifiers. The live scanner still uses only the F1-best model
            ({deployed}). Lab is for seeing where they agree and where they split.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          {EXAMPLE_URLS.map(({ label, url: sample, type }) => (
            <button
              key={sample}
              onClick={() => { setUrl(sample); runCompare(sample) }}
              style={{
                padding: '6px 14px',
                background: 'transparent',
                border: `1px solid ${type === 'fake' ? 'rgba(255,51,102,0.3)' : 'rgba(0,255,136,0.3)'}`,
                borderRadius: 20,
                color: type === 'fake' ? 'var(--red)' : 'var(--green)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="url-input"
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              style={{ flex: 1, minWidth: 220 }}
              disabled={loading}
            />
            <button className="btn-primary" onClick={() => runCompare()} disabled={loading}>
              {loading ? 'Comparing…' : 'Compare models'}
            </button>
          </div>
          {loading && (
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--cyan)' }}>
              <div className="spinner" style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: '0.9rem' }}>{stage}</span>
            </div>
          )}
          {error && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: 'rgba(255,51,102,0.08)',
              border: '1px solid rgba(255,51,102,0.25)',
              borderRadius: 8, color: 'var(--red)', fontSize: '0.88rem',
            }}>
              {error}
            </div>
          )}
        </div>

        {data?.models && (
          <>
            <div className="glass-card" style={{ padding: '16px 22px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Vote: <strong style={{ color: fakeVotes ? 'var(--red)' : 'var(--green)' }}>
                  {fakeVotes}/{totalVotes} Fake
                </strong>
                {' · '}
                {totalVotes - fakeVotes}/{totalVotes} Legitimate
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Winner = highest confidence{winnerName === deployed ? ` · deployed model` : ''}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {shown.map(model => {
                const isWinner = model.name === winnerName
                const isDeployed = model.name === deployed
                const isFake = model.prediction === 'Fake'
                const fakePct = model.proba_fake ?? (isFake ? model.confidence : 100 - model.confidence)
                const legitPct = model.proba_legit ?? (isFake ? 100 - model.confidence : model.confidence)
                return (
                  <div
                    key={model.name}
                    className="glass-card fade-in-up"
                    style={{
                      padding: 24,
                      border: isWinner ? '1px solid var(--cyan)' : '1px solid var(--border)',
                      boxShadow: isWinner ? '0 0 24px rgba(0,212,255,0.18)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                      <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem' }}>{model.name}</h3>
                      {isWinner && (
                        <span style={{ color: 'var(--cyan)', fontSize: '0.72rem', fontWeight: 700 }}>WINNER</span>
                      )}
                    </div>
                    {isDeployed && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                        Deployed on Scan
                      </div>
                    )}
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: isFake ? 'var(--red)' : 'var(--green)',
                      marginBottom: 10,
                    }}>
                      {model.prediction}
                    </div>
                    <RiskBadge level={model.risk} />
                    <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Class split
                    </div>
                    <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginTop: 6, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ width: `${legitPct}%`, background: 'var(--green)' }} />
                      <div style={{ width: `${fakePct}%`, background: 'var(--red)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--green)' }}>Legit {Number(legitPct).toFixed(1)}%</span>
                      <span style={{ color: 'var(--red)' }}>Fake {Number(fakePct).toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
