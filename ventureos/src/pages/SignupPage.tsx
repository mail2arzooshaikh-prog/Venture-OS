import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2, Zap, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import VentureGrid from '../components/background/VentureGrid'

type Strength = 'weak' | 'medium' | 'strong'

function getPasswordStrength(p: string): Strength {
  if (p.length < 8) return 'weak'
  const hasLetters = /[a-zA-Z]/.test(p)
  const hasNumbers = /[0-9]/.test(p)
  const hasSymbols = /[^a-zA-Z0-9]/.test(p)
  if (p.length >= 12 && hasLetters && hasNumbers && hasSymbols) return 'strong'
  if (hasLetters && hasNumbers) return 'medium'
  return 'weak'
}

const strengthColor: Record<Strength, string> = { weak: '#EF4444', medium: '#F59E0B', strong: '#22C55E' }
const strengthLabel: Record<Strength, string> = { weak: 'Weak', medium: 'Medium', strong: 'Strong' }

const SignupPage: React.FC = () => {
  const { signUp, user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }) }, [user, navigate])

  const strength = password ? getPasswordStrength(password) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Full name is required.'); return }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return }
    if (!password || strength === 'weak') { setError('Password is too weak. Use at least 8 characters with letters and numbers.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (!agreedTerms) { setError('Please accept the terms of service.'); return }

    setLoading(true)
    const { error: signUpError } = await signUp(email, password, name)
    setLoading(false)
    if (signUpError) {
      const msg = signUpError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
        setError('An account with this email already exists. Try signing in.')
      } else if (msg.includes('password')) {
        setError('Password does not meet requirements. Use at least 8 characters.')
      } else {
        setError(signUpError.message)
      }
    } else {
      setRegisteredEmail(email)
      setSuccess(true)
    }
  }

  return (
    <div className="auth-container" style={{ minHeight: '100vh' }}>
      {/* Brand panel */}
      <div className="auth-brand" style={{ position: 'relative', overflow: 'hidden' }}>
        <VentureGrid variant="login" />
        <div style={{ position: 'relative', zIndex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #4F8CFF, #8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={22} color="#fff" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>VentureOS</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, lineHeight: 1.25, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Start your business<br /><span className="text-gradient">intelligence journey.</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 340 }}>
              Join thousands of entrepreneurs using VentureOS to grow smarter. Free to start, no credit card required.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 420 }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={32} color="#22C55E" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Check your email!</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
                We sent a confirmation link to <strong style={{ color: 'var(--text-primary)' }}>{registeredEmail}</strong>. Click it to activate your account, then sign in.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>Go to Sign In</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create your account.</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Start building your business workspace.</p>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="label" htmlFor="fullname">Full name</label>
                  <input id="fullname" type="text" className="input" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} disabled={loading} autoComplete="name" required />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="label" htmlFor="email">Email address</label>
                  <input id="email" type="email" className="input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} autoComplete="email" required />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="label" htmlFor="password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="password" type={showPw ? 'text' : 'password'} className="input" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} style={{ paddingRight: '3rem' }} required />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {strength && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%', background: strengthColor[strength], borderRadius: 2, transition: 'width 0.3s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: strengthColor[strength], fontWeight: 500, minWidth: 50 }}>{strengthLabel[strength]}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="label" htmlFor="confirm">Confirm password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="confirm" type={showConfirm ? 'text' : 'password'} className={`input${confirm && confirm !== password ? ' input-error' : ''}`} placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={loading} style={{ paddingRight: '3rem' }} required />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} style={{ accentColor: 'var(--accent-blue)' }} />
                  I agree to the <Link to="#" style={{ color: 'var(--accent-blue)' }}>terms of service</Link>
                </label>

                {error && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                    <AlertCircle size={16} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--error)' }}>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }} disabled={loading}>
                  {loading ? <><Loader2 size={18} className="spin" /> Creating account…</> : 'Create Account'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SignupPage
