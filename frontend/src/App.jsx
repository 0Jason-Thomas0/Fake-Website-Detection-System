import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Detection from './pages/Detection'
import History from './pages/History'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import ScanReport from './pages/ScanReport'
import Batch from './pages/Batch'
import Lab from './pages/Lab'

function NotFound() {
  return (
    <div style={{
      paddingTop: 120,
      textAlign: 'center',
      minHeight: '100vh',
      color: 'var(--text-secondary)',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: 20 }}>404</div>
      <h1 style={{ fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Page Not Found</h1>
      <a href="/" style={{ color: 'var(--cyan)', fontWeight: 600 }}>← Go Home</a>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/detect"      element={<Detection />} />
        <Route path="/batch"       element={<Batch />} />
        <Route path="/lab"         element={<Lab />} />
        <Route path="/history/:id" element={<ScanReport />} />
        <Route path="/history"     element={<History />} />
        <Route path="/about"       element={<About />} />
        <Route path="*"        element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
