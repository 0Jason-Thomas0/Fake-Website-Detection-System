import { useState, useEffect } from 'react'
import { getModelInfo } from '../api/client'

const TECH_STACK = [
  { category: 'Frontend',         items: ['React 18', 'React Router 6', 'Axios', 'Vite'] },
  { category: 'Backend',          items: ['Python 3.11', 'Flask 3', 'Flask-CORS', 'SQLite'] },
  { category: 'Machine Learning', items: ['Scikit-learn', 'Pandas', 'NumPy', 'Joblib'] },
  { category: 'Tools',            items: ['VS Code', 'Git', 'GitHub', 'Matplotlib'] },
]

const FEATURES_USED = [
  'URL Length', 'Domain Length', 'Dot Count', 'Hyphen Count',
  'Digit Count', 'Slash Count', 'Subdomain Count', 'HTTPS Present',
  'IP Address', '"@" Symbol', 'Domain Hyphen', 'Suspicious Keywords', 'Prefix-Suffix',
]

const WORKFLOW = [
  { icon: '📦', step: 'Dataset', desc: 'Phishing URL dataset with real feature patterns' },
  { icon: '🧹', step: 'Preprocessing', desc: 'Normalize, clean, balance classes' },
  { icon: '⚙',  step: 'Feature Extraction', desc: '13 URL-based features extracted per sample' },
  { icon: '🤖', step: 'Model Training', desc: 'RF, DT & LR trained and compared' },
  { icon: '📊', step: 'Evaluation', desc: 'Accuracy, F1, ROC-AUC, Confusion Matrix' },
  { icon: '💾', step: 'Deployment', desc: 'Best model saved via Joblib → served via Flask API' },
]

export default function About() {
  const [metrics, setMetrics] = useState(null)
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  useEffect(() => {
    getModelInfo()
      .then(res => setMetrics(res.data))
      .catch(() => setMetrics(null))
      .finally(() => setLoadingMetrics(false))
  }, [])

  const best = metrics?.models?.find(m => m.name === metrics.best_model)

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 1000 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', marginBottom: 20,
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 100, fontSize: '0.78rem', fontWeight: 600,
            color: 'var(--cyan)', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            ℹ About The Project
          </div>
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 16 }}>
            About <span className="gradient-text">PhishGuard AI</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
            A B.Tech 3rd Year project demonstrating the integration of Artificial Intelligence
            with Cybersecurity to detect phishing and fake websites using supervised Machine Learning.
          </p>
        </div>

        {/* Project Info Card */}
        <div className="glass-card" style={{ padding: 36, marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 28 }}>
            {[
              { label: 'Project Type', value: 'AI + Cybersecurity' },
              { label: 'Academic Level', value: 'B.Tech 3rd Year' },
              { label: 'Department', value: 'AI & Data Science' },
              { label: 'Project Version', value: '1.0' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ML Model Metrics */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>
            🤖 Model Performance
          </h2>

          {loadingMetrics ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36 }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading model metrics...</p>
            </div>
          ) : !metrics ? (
            <div className="glass-card" style={{ padding: 36, textAlign: 'center', color: 'var(--yellow)', border: '1px solid rgba(255,187,0,0.2)' }}>
              ⚠ Model metrics not available. Run <code style={{ color: 'var(--cyan)' }}>python train_model.py</code> first.
            </div>
          ) : (
            <>
              {/* Best Model Highlight */}
              {best && (
                <div className="glass-card" style={{
                  padding: 28, marginBottom: 24,
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(0,128,255,0.03))',
                  border: '1px solid rgba(0,212,255,0.25)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: '1.4rem' }}>🏆</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Best Model</div>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', fontWeight: 700, color: 'var(--cyan)' }}>{best.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
                    {[
                      { label: 'Accuracy',  value: `${best.accuracy}%` },
                      { label: 'Precision', value: `${best.precision}%` },
                      { label: 'Recall',    value: `${best.recall}%` },
                      { label: 'F1 Score',  value: `${best.f1_score}%` },
                      { label: 'ROC-AUC',   value: `${best.roc_auc}%` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>{value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Models Comparison */}
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Model Comparison
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Model</th>
                        <th>Accuracy</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1 Score</th>
                        <th>ROC-AUC</th>
                        <th>CV (5-fold)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.models.map(m => (
                        <tr key={m.name}>
                          <td>
                            <span style={{ fontWeight: 600, color: m.name === metrics.best_model ? 'var(--cyan)' : 'var(--text-primary)' }}>
                              {m.name === metrics.best_model ? '🏆 ' : ''}{m.name}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-primary)' }}>{m.accuracy}%</td>
                          <td style={{ color: 'var(--text-primary)' }}>{m.precision}%</td>
                          <td style={{ color: 'var(--text-primary)' }}>{m.recall}%</td>
                          <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>{m.f1_score}%</td>
                          <td style={{ color: 'var(--text-primary)' }}>{m.roc_auc}%</td>
                          <td style={{ color: 'var(--text-muted)' }}>{m.cv_mean}% ± {m.cv_std}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>📊 Training samples: <strong style={{ color: 'var(--cyan)' }}>{metrics.train_samples?.toLocaleString()}</strong></span>
                <span>🧪 Test samples: <strong style={{ color: 'var(--cyan)' }}>{metrics.test_samples?.toLocaleString()}</strong></span>
                <span>⚙ Features: <strong style={{ color: 'var(--cyan)' }}>{metrics.feature_count}</strong></span>
              </div>
            </>
          )}
        </section>

        {/* Features Used */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>
            ⚙ Extracted URL Features
          </h2>
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FEATURES_USED.map((f, i) => (
                <span key={i} style={{
                  padding: '6px 14px',
                  background: 'rgba(0,212,255,0.07)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 20,
                  fontSize: '0.82rem',
                  color: 'var(--cyan)',
                  fontWeight: 500,
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>
            🔄 ML Pipeline Workflow
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {WORKFLOW.map(({ icon, step, desc }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 20, flexShrink: 0 }}>
                  <div style={{
                    width: 48, height: 48,
                    background: 'rgba(0,212,255,0.1)',
                    border: '2px solid rgba(0,212,255,0.25)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}>
                    {icon}
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 32, background: 'rgba(0,212,255,0.15)', margin: '4px 0' }} />
                  )}
                </div>
                <div style={{ paddingTop: 10, paddingBottom: i < WORKFLOW.length - 1 ? 20 : 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{step}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>
            🛠 Technology Stack
          </h2>
          <div className="grid-2">
            {TECH_STACK.map(({ category, items }) => (
              <div key={category} className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 16 }}>
                  {category}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(item => (
                    <div key={item} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: '0.9rem', color: 'var(--text-primary)',
                    }}>
                      <span style={{ color: 'var(--green)', fontSize: '0.7rem' }}>▶</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
