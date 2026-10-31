import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2, Zap, Users, Camera, Brain, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import VentureGrid from '../components/background/VentureGrid'

const LoginPage: React.FC = () => {
  const { signIn, user, loading: authLoading, enterDemoMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string })?.from || '/dashboard'

  // Restore remembered email
  useEffect(() => {
    const saved = localStorage.getItem('ventureos_remembered_email')
    if (saved) { setEmail(saved); setRememberMe(true) }
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) navigate(from, { replace: true })
  }, [user, authLoading, navigate, from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return }
    if (!password) { setError('Password is required.'); return }

    setLoading(true)
    setError(null)

    if (rememberMe) localStorage.setItem('ventureos_remembered_email', email)
    else localStorage.removeItem('ventureos_remembered_email')

    const { error: signInError } = await signIn(email, password)
    setLoading(false)

    if (signInError) {
      const msg = signInError.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.includes('email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox.')
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(signInError.message)
      }
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="auth-container" style={{ minHeight: '100vh' }}>
      {/* ── Left brand panel ── */}
      <div className="auth-brand" style={{ position: 'relative', overflow: 'hidden' }}>
        <VentureGrid variant="login" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '2.5rem' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #4F8CFF, #8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={22} color="#fff" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>VentureOS</span>
          </div>

          {/* Headline */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, lineHeight: 1.25, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Your business.<br />
              <span className="text-gradient">One intelligent</span><br />
              operating system.
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 340, marginBottom: '2.5rem' }}>
              Manage clients, understand your finances, capture business documents and make smarter decisions with AI.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: <Users size={16} />, label: 'Clients, invoices & payments in one place' },
                { icon: <Camera size={16} />, label: 'Venture Vision — scan any business document' },
                { icon: <Brain size={16} />, label: 'Venture AI — insights from your real data' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(79,140,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(79,140,255,0.1)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '0.3rem 0.75rem' }}>VentureOS v1.0</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 420 }}>
          {!isSupabaseConfigured && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--warning)', lineHeight: 1.5 }}>
                <strong>Demo mode:</strong> Supabase is not configured. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication.
              </span>
            </div>
          )}

          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome back.</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Your business workspace is ready.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className={`input${error && !email ? ' input-error' : ''}`}
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: '3rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--accent-blue)' }}
                />
                Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            {error && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--error)' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? <><Loader2 size={18} className="spin" /> Signing in…</> : 'Sign in to VentureOS'}
            </button>

            {!isSupabaseConfigured && (
              <button
                type="button"
                onClick={() => {
                  enterDemoMode()
                  navigate('/dashboard', { replace: true })
                }}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', padding: '0.75rem', fontSize: '0.9rem', gap: '0.5rem' }}
              >
                <Sparkles size={16} /> Enter Demo Workspace (Sample Data)
              </button>
            )}
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
