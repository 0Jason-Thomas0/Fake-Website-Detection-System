import { useState } from 'react'
import { Link } from 'react-router-dom'
import { predictBatch } from '../api/client'
import RiskBadge from '../components/RiskBadge'

const EXAMPLE_URLS = [
  { label: 'Google', url: 'https://www.google.com', type: 'legit' },
  { label: 'GitHub', url: 'https://github.com/openai', type: 'legit' },
  { label: 'PayPal Phish', url: 'http://paypal-secure-login.tk/verify', type: 'fake' },
  { label: 'IP-based', url: 'http://192.168.1.1/bank-login/verify', type: 'fake' },
]

function parseUrls(text) {
  return text
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

export default function Batch() {
  const [text, setText] = useState('')
  const [results, setResults] = useState([])
  const [failed, setFailed] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fillExamples = () => {
    setText(EXAMPLE_URLS.map(e => e.url).join('\n'))
    setError('')
  }

  const handleAnalyze = async () => {
    const urls = parseUrls(text)
    setError('')
    setResults([])
    setFailed([])
    if (!urls.length) {
      setError('Paste at least one URL.')
      return
    }
    if (urls.length > 25) {
      setError('Batch is limited to 25 URLs.')
      return
    }
    setLoading(true)
    try {
      const res = await predictBatch(urls)
      setResults(res.data.results || [])
      setFailed(res.data.failed || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Batch scan failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 960 }}>
        <div style={{ marginBottom: 36 }}>
          <div className="kicker">Batch scanner</div>
          <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>
            Score many URLs
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
            Paste up to 25 URLs (one per line). Invalid ones are reported without stopping the batch.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          {EXAMPLE_URLS.map(({ label, url, type }) => (
            <button
              key={url}
              onClick={() => setText(prev => prev ? `${prev.trim()}\n${url}` : url)}
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
          <button className="btn-secondary" onClick={fillExamples} style={{ padding: '6px 14px' }}>
            Use all examples
          </button>
        </div>

        <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
          <textarea
            className="url-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"https://www.google.com\nhttp://paypal-secure-login.tk/verify"}
            rows={8}
            style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
            disabled={loading}
          />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {parseUrls(text).length} / 25 URLs
            </span>
            <button className="btn-primary" onClick={handleAnalyze} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze batch'}
            </button>
          </div>
        </div>

        {failed.length > 0 && (
          <div className="glass-card" style={{ padding: 20, marginBottom: 20, border: '1px solid rgba(255,51,102,0.2)' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--red)', marginBottom: 10 }}>Failed URLs</h3>
            {failed.map(item => (
              <p key={item.url} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                {item.url} — {item.error}
              </p>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Risk</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(row => (
                    <tr key={row.id || row.url}>
                      <td style={{ maxWidth: 280, wordBreak: 'break-all', fontSize: '0.85rem' }}>{row.url}</td>
                      <td style={{ fontWeight: 700, color: row.prediction === 'Fake' ? 'var(--red)' : 'var(--green)' }}>
                        {row.prediction}
                      </td>
                      <td>{Number(row.confidence).toFixed(1)}%</td>
                      <td><RiskBadge level={row.risk} /></td>
                      <td>
                        {row.id && (
                          <Link to={`/history/${row.id}`} style={{ color: 'var(--cyan)', fontWeight: 600 }}>
                            Open →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
