import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronRight, ChevronLeft, Check, Zap, Briefcase, ShoppingBag, Users, Wrench, Video, Rocket, MapPin, HelpCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import VentureGrid from '../components/background/VentureGrid'

const CATEGORIES = [
  { value: 'freelancer', label: 'Freelancer', icon: <Zap size={22} /> },
  { value: 'retail', label: 'Retail', icon: <ShoppingBag size={22} /> },
  { value: 'agency', label: 'Agency', icon: <Users size={22} /> },
  { value: 'service', label: 'Service', icon: <Wrench size={22} /> },
  { value: 'creator', label: 'Creator', icon: <Video size={22} /> },
  { value: 'startup', label: 'Startup', icon: <Rocket size={22} /> },
  { value: 'local', label: 'Local Business', icon: <MapPin size={22} /> },
  { value: 'other', label: 'Other', icon: <HelpCircle size={22} /> },
]

const STAGES = ['Just an idea', 'Early stage', 'Growing', 'Established', 'Scaling']
const STAGE_VALUES = ['idea', 'early', 'growing', 'established', 'scaling']
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']
const GOALS = ['Get more clients', 'Manage finances better', 'Organize documents', 'Use AI insights', 'All of the above']

const OnboardingPage: React.FC = () => {
  const { updateBusiness, business } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState(business?.name || '')
  const [category, setCategory] = useState(business?.category || '')
  const [stage, setStage] = useState(business?.stage || '')
  const [currency, setCurrency] = useState(business?.currency || 'INR')
  const [goal, setGoal] = useState(business?.primary_goal || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const TOTAL = 5

  const progress = ((step - 1) / (TOTAL - 1)) * 100

  const next = () => {
    setError(null)
    if (step === 1 && !businessName.trim()) { setError('Please enter your business name.'); return }
    if (step === 2 && !category) { setError('Please select a business category.'); return }
    if (step === 3 && !stage) { setError('Please select your business stage.'); return }
    setStep(s => Math.min(s + 1, TOTAL))
  }

  const back = () => { setError(null); setStep(s => Math.max(s - 1, 1)) }

  const finish = async () => {
    setLoading(true)
    setError(null)
    const { error: err } = await updateBusiness({
      name: businessName.trim(),
      category,
      stage,
      currency,
      primary_goal: goal,
      onboarding_completed: true,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '1rem' }}>
      <VentureGrid variant="default" />

      <div className="card" style={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>
        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#4F8CFF,#8B5CF6)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>VentureOS</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Step {step} of {TOTAL}</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#4F8CFF,#8B5CF6)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Steps */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Let's set up your workspace</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>What's your business name?</p>
            <input className="input" style={{ fontSize: '1.1rem', padding: '0.9rem 1rem' }} placeholder="e.g. Acme Studio" value={businessName} onChange={e => setBusinessName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && next()} />
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>What type of business?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>This helps us tailor your experience.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem' }}>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', borderRadius: 'var(--radius-md)', border: `2px solid ${category === c.value ? 'var(--accent-blue)' : 'var(--border-subtle)'}`, background: category === c.value ? 'rgba(79,140,255,0.12)' : 'var(--bg-elevated)', cursor: 'pointer', color: category === c.value ? 'var(--accent-blue)' : 'var(--text-secondary)', transition: 'all 0.2s ease', fontSize: '0.75rem', fontWeight: 500 }}>
                  {c.icon}
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>What stage is your business?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Be honest — we'll give you the right tools.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {STAGES.map((s, i) => (
                <button key={s} onClick={() => setStage(STAGE_VALUES[i])} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: `2px solid ${stage === STAGE_VALUES[i] ? 'var(--accent-blue)' : 'var(--border-subtle)'}`, background: stage === STAGE_VALUES[i] ? 'rgba(79,140,255,0.1)' : 'var(--bg-elevated)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s ease' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${stage === STAGE_VALUES[i] ? 'var(--accent-blue)' : 'var(--border-medium)'}`, background: stage === STAGE_VALUES[i] ? 'var(--accent-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {stage === STAGE_VALUES[i] && <Check size={11} color="#fff" />}
                  </div>
                  <span style={{ fontWeight: 500, color: stage === STAGE_VALUES[i] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-up">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>A few preferences</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Customize your workspace defaults.</p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Preferred currency</label>
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value)} style={{ cursor: 'pointer' }}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Primary goal</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {GOALS.map(g => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: `1px solid ${goal === g ? 'var(--accent-blue)' : 'var(--border-subtle)'}`, background: goal === g ? 'rgba(79,140,255,0.08)' : 'var(--bg-elevated)', cursor: 'pointer' }}>
                    <input type="radio" name="goal" value={g} checked={goal === g} onChange={() => setGoal(g)} style={{ accentColor: 'var(--accent-blue)' }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-slide-up" style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,rgba(79,140,255,0.2),rgba(139,92,246,0.2))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid rgba(79,140,255,0.3)' }}>
              <Check size={32} color="var(--accent-blue)" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Welcome to VentureOS,<br />
              <span className="text-gradient">{businessName}!</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 2rem' }}>
              Your workspace is ready. Manage clients, track finances, scan documents, and get AI-powered insights — all in one place.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {['Clients & Invoices', 'Venture Vision', 'Venture AI', 'Document Vault'].map(f => (
                <span key={f} style={{ padding: '0.4rem 0.875rem', borderRadius: 20, background: 'rgba(79,140,255,0.1)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 500 }}>{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--error)' }}>{error}</span>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', justifyContent: step === 1 ? 'flex-end' : 'space-between' }}>
          {step > 1 && (
            <button className="btn btn-secondary" onClick={back} disabled={loading}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < TOTAL ? (
            <button className="btn btn-primary" onClick={next}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={finish} disabled={loading} style={{ flex: 1 }}>
              {loading ? <><Loader2 size={16} className="spin" /> Setting up…</> : 'Go to Dashboard →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage
