import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Loader2, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import VentureGrid from '../components/background/VentureGrid'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      // Always show success — don't reveal if email exists
      setSent(true)
    } catch (err: unknown) {
      const msg = (err as Error).message?.toLowerCase() || ''
      if (msg.includes('network') || msg.includes('fetch')) {
        setError('Network error. Please check your connection.')
      } else {
        // Generic fallback — still show success to avoid email enumeration
        setSent(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <VentureGrid variant="default" />

      <div className="card" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1, margin: '1rem' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #4F8CFF, #8B5CF6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>VentureOS</span>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: 60, height: 60, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle2 size={28} color="#22C55E" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>Check your email!</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '0.5rem' }}>
              We've sent a recovery link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
              The link expires in 1 hour. Check your spam folder if you don't see it.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Reset your password</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
              Enter your email and we'll send you a recovery link.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                  <AlertCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--error)' }}>{error}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }} disabled={loading}>
                {loading ? <><Loader2 size={18} className="spin" /> Sending…</> : 'Send Recovery Link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
