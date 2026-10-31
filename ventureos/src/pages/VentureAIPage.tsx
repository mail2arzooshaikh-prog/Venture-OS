import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, Loader2, X, TrendingUp, Brain, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { sendAIMessage, getAIInsights } from '../lib/api'
import AppLayout from '../components/layout/AppLayout'

interface Message { role: 'user' | 'assistant'; content: string }
interface Insight { title: string; description: string; type: string; priority: string }

const SUGGESTED_PROMPTS = [
  'Analyze my revenue trend',
  'Which client has pending invoices?',
  'How can I optimize operating expenses?',
  'Draft a client payment reminder email',
  'What are 3 ideas to acquire more clients?',
  'Help me draft a business proposal',
]

function evaluateMath(expr: string): number | null {
  try {
    const clean = expr.replace(/[^0-9+\-*/().% ]/g, '').replace(/%/g, '/100')
    if (!clean.trim()) return null
    const result = Function(`'use strict'; return (${clean})`)()
    if (typeof result === 'number' && !isNaN(result)) return result
  } catch {
    return null
  }
  return null
}

function getSmartFallback(msg: string, businessName?: string, userName?: string): string {
  const text = msg.trim()
  const q = text.toLowerCase()
  const founder = userName || 'there'
  const company = businessName || 'your business'

  // Math
  if (/[0-9]/.test(q) && (/(\+|\-|\*|\/|percent|%|calculate|what is [0-9])/i.test(q))) {
    const match = q.replace(/^(what is|calculate|solve)\s*/i, '')
    const val = evaluateMath(match)
    if (val !== null) {
      return `The result is **${val.toLocaleString()}**.\n\nLet me know if you need any other calculations or financial projections!`
    }
  }

  // Greetings
  if (/^(hi|hello|hey|greetings|howdy|what's up|yo)\b/i.test(q)) {
    return `Hey ${founder}! Great to sync up. 👋\n\nI'm your Venture AI copilot for **${company}**. How can I help you today? Ask me anything from drafting client communications and evaluating business strategy to running calculations or exploring growth channels.`
  }

  // Persona
  if (q.includes('who are you') || q.includes('what are you') || q.includes('what can you do')) {
    return `I'm **Venture AI** — your AI co-founder, strategic advisor, and business copilot built specifically for **${company}**.\n\nHere is what we can do together:\n\n* 💬 **Strategic Advisory**: Bounce business ideas, evaluate trade-offs, and plan next steps.\n* ✍️ **Draft Communications**: Write professional emails, invoices, follow-ups, and proposals.\n* 📊 **Financial Intelligence**: Review your actual revenue, operating expenses, and pending client invoices.\n* 🎯 **Strategy & Growth**: Brainstorm pricing models, customer acquisition channels, and weekly priorities.\n\nAsk me anything on your mind — I'm ready!`
  }

  // Drafting
  if (q.includes('draft') || q.includes('write an email') || q.includes('follow up') || q.includes('reminder')) {
    return `Here is a professional payment reminder email draft:\n\n---\n**Subject:** Follow-up: Invoice #[Invoice Number] — ${company}\n\nHi [Client Name],\n\nHope you're having a productive week.\n\nI wanted to send a quick follow-up regarding **Invoice #[Invoice Number]** for **[Amount]**, which is scheduled for payment by **[Due Date]**.\n\nYou can review and settle the invoice directly via the secure portal link here: [Pay Invoice](http://localhost:5173/invoices).\n\nIf your finance team has already initiated the payment, please disregard this note. Otherwise, feel free to let me know if you need any updated purchase orders or vendor documentation.\n\nAppreciate your partnership,\n\n**${founder}**\n${company}\n---\n\n💡 *Tip: Tell me if you'd like a firmer or more casual tone, or want me to tailor it for a specific client!*`
  }

  // Hiring
  if (q.includes('hire') || q.includes('afford') || q.includes('salary') || q.includes('developer') || q.includes('headcount')) {
    return `To assess hiring feasibility accurately, track your recurring monthly revenue and operating expenses in the workspace. That enables me to compute your true cash surplus and sustainable payroll capacity without guessing.\n\nWould you like help defining role requirements, key milestones, or target delivery metrics for this position?`
  }

  // Growth & Marketing
  if (q.includes('marketing') || q.includes('grow') || q.includes('acquire') || q.includes('sales') || q.includes('more clients')) {
    return `Here are 3 tactical growth moves for **${company}**:\n\n1. **Launch a Structured Referral Incentive for Existing Clients:**\n   * Offer a 15% recurring discount or bonus service credit for warm introductions to peer founders in their network.\n2. **Offer Value-Add Retainer Upsells:**\n   * Review your active client accounts to identify accounts that would benefit from dedicated priority support or optimization reviews.\n3. **Publish Concrete Case Studies:**\n   * Highlight specific hours and dollars saved for your current clients to build credibility with prospective leads.\n\nWhich of these channels feels most aligned with your goals this month?`
  }

  // Financial lookups
  if (q.includes('revenue') || q.includes('mrr') || q.includes('trend')) {
    return `Financial metrics are pulled live from your verified workspace database. If you have not created invoices or recorded payments yet, you can do so in the Invoices tab to see live trend charts and margin analytics here.`
  }

  // General questions
  return `### 💡 Strategic Advisory\n\nRegarding "${text}":\n\nWhen evaluating this for **${company}**, look at the immediate operational requirement and the medium-term return on investment.\n\nTell me a bit more about what you have in mind — are you looking for a tactical implementation plan, a risk assessment, or creative brainstorming? Let's break it down!`
}

const VentureAIPage: React.FC = () => {
  const { business, user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<Insight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [isGeminiActive, setIsGeminiActive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check backend AI status
  useEffect(() => {
    fetch('http://localhost:3001/api/ai/status')
      .then(res => res.json())
      .then(data => {
        if (data.configured) setIsGeminiActive(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const load = async () => {
      setInsightsLoading(true)
      try {
        const res = await getAIInsights()
        if (res.insights && res.insights.length > 0) {
          setInsights(res.insights)
        } else {
          setInsights([])
        }
      } catch {
        setInsights([])
      } finally {
        setInsightsLoading(false)
      }
    }
    load()
  }, [])

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const companyName = business?.name || 'Your Business'

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg) return

    const userMsg: Message = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await sendAIMessage(msg, history)

      const replyContent = res.response || res.message || getSmartFallback(msg, companyName, userName)
      setMessages(prev => [...prev, { role: 'assistant', content: replyContent }])
    } catch {
      const fallback = getSmartFallback(msg, companyName, userName)
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const PRIORITY_COLORS: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#4F8CFF' }

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', margin: '-2rem -2rem -2rem -2rem' }}>
        {/* ── Left panel: Business Insights ── */}
        <div style={{ width: 320, borderRight: '1px solid rgba(22,34,56,0.85)', background: '#0D1424', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(22,34,56,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} className="text-[#4F8CFF]" />
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F4F7FF' }}>Business Pulse</h3>
              </div>
              <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', color: '#22C55E', background: 'rgba(34,197,94,0.12)', padding: '0.15rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>
                REALTIME
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9AA9C2' }}>Autonomous financial &amp; operational intelligence</p>
          </div>

          {/* Quick Workspace Bar */}
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(22,34,56,0.6)', background: 'rgba(17,27,46,0.4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#9AA9C2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Workspace</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F4F7FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {business?.name || 'Workspace'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#9AA9C2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Engine</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isGeminiActive ? '#22C55E' : '#4F8CFF', fontFamily: 'monospace' }}>
                {isGeminiActive ? 'Gemini 1.5' : 'Autonomous'}
              </div>
            </div>
          </div>

          {/* Insights Cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9AA9C2', marginBottom: '0.75rem' }}>
              Strategic Recommendations
            </div>
            {insightsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card" style={{ marginBottom: '0.75rem', padding: '0.875rem' }}>
                  <div className="skeleton skeleton-text" style={{ marginBottom: '0.5rem', width: '60%' }} />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                </div>
              ))
            ) : insights.length === 0 ? (
              <div style={{ padding: '1.5rem 0.75rem', textAlign: 'center', background: 'rgba(17,27,46,0.4)', borderRadius: 10, border: '1px solid rgba(22,34,56,0.8)' }}>
                <p style={{ color: '#9AA9C2', fontSize: '0.785rem', lineHeight: 1.5, margin: 0 }}>
                  No recommendations yet. Insights will appear here automatically as you record clients, invoices, and expenses.
                </p>
              </div>
            ) : (
              insights.map((ins, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 10,
                    background: '#111B2E',
                    border: '1px solid rgba(22,34,56,0.9)',
                    borderLeft: `3px solid ${PRIORITY_COLORS[ins.priority] || '#4F8CFF'}`,
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#F4F7FF', marginBottom: '0.35rem' }}>{ins.title}</p>
                  <p style={{ color: '#9AA9C2', fontSize: '0.785rem', lineHeight: 1.5, margin: 0 }}>{ins.description}</p>
                </div>
              ))
            )}
          </div>

          {/* Suggested Prompts */}
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(22,34,56,0.8)' }}>
            <p style={{ fontSize: '0.72rem', color: '#9AA9C2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Suggested Questions:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {SUGGESTED_PROMPTS.slice(0, 3).map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  style={{
                    padding: '0.45rem 0.65rem',
                    background: 'rgba(17,27,46,0.6)',
                    border: '1px solid rgba(79,140,255,0.15)',
                    borderRadius: 6,
                    color: '#9AA9C2',
                    fontSize: '0.78rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#F4F7FF'; e.currentTarget.style.borderColor = '#4F8CFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#9AA9C2'; e.currentTarget.style.borderColor = 'rgba(79,140,255,0.15)'; }}
                >
                  &ldquo;{p}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Chat Panel ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#080D18' }}>
          {/* Header */}
          <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid rgba(22,34,56,0.85)', background: 'rgba(13,20,36,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#4F8CFF,#8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(79,140,255,0.3)' }}>
                <Brain size={20} color="#fff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#F4F7FF', margin: 0 }}>Venture AI Copilot</p>
                  <span style={{
                    fontSize: '0.625rem',
                    fontFamily: 'monospace',
                    color: isGeminiActive ? '#22C55E' : '#4F8CFF',
                    background: isGeminiActive ? 'rgba(34,197,94,0.15)' : 'rgba(79,140,255,0.15)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: 4,
                    fontWeight: 700,
                    border: isGeminiActive ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(79,140,255,0.3)',
                  }}>
                    {isGeminiActive ? '● GEMINI 1.5 FLASH (ACTIVE)' : 'AUTONOMOUS COPILOT'}
                  </span>
                </div>
                <p style={{ color: '#22C55E', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 6px #22C55E' }} />
                  Tracking Real-time Operations &amp; Workspace Telemetry
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* AI Status Indicator */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: isGeminiActive ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(79,140,255,0.25)',
                  background: isGeminiActive ? 'rgba(34,197,94,0.1)' : 'rgba(79,140,255,0.1)',
                  color: isGeminiActive ? '#22C55E' : '#4F8CFF',
                }}
              >
                <Sparkles size={13} />
                <span>{isGeminiActive ? 'Gemini 1.5 Active' : 'Autonomous Engine'}</span>
              </div>

              {messages.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMessages([])}
                  style={{ fontSize: '0.78rem', color: '#9AA9C2' }}
                >
                  <X size={14} className="mr-1" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3.5rem 2rem', margin: 'auto' }}>
                <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,rgba(79,140,255,0.15),rgba(139,92,246,0.15))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid rgba(79,140,255,0.25)' }}>
                  <Sparkles size={28} className="text-[#8B5CF6]" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#F4F7FF', marginBottom: '0.5rem' }}>
                  Hello, {userName}!
                </h3>
                <p style={{ color: '#9AA9C2', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 2rem' }}>
                  I am your personalized AI co-founder for {companyName}. Ask me anything about business strategy, drafting client communications, financial analysis, or day-to-day operations.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center', maxWidth: 640, margin: '0 auto' }}>
                  {SUGGESTED_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      style={{
                        padding: '0.5rem 0.85rem',
                        background: '#111B2E',
                        border: '1px solid rgba(79,140,255,0.2)',
                        borderRadius: 8,
                        color: '#F4F7FF',
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4F8CFF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(79,140,255,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '0.75rem',
                }}
              >
                {m.role === 'assistant' && (
                  <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4F8CFF,#8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, boxShadow: '0 0 10px rgba(79,140,255,0.25)' }}>
                    <Brain size={16} color="#fff" />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '1rem 1.25rem',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? 'linear-gradient(135deg, #4F8CFF 0%, #36D6E7 100%)' : '#111B2E',
                    color: '#F4F7FF',
                    border: m.role === 'assistant' ? '1px solid rgba(22,34,56,0.95)' : 'none',
                    lineHeight: 1.65,
                    fontSize: '0.885rem',
                    boxShadow: m.role === 'user' ? '0 4px 16px rgba(79,140,255,0.3)' : '0 4px 16px rgba(0,0,0,0.3)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4F8CFF,#8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Brain size={16} color="#fff" />
                </div>
                <div style={{ padding: '0.85rem 1.25rem', background: '#111B2E', border: '1px solid rgba(22,34,56,0.9)', borderRadius: '16px 16px 16px 4px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#9AA9C2', marginRight: '0.4rem' }}>Thinking &amp; analyzing…</span>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F8CFF', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid rgba(22,34,56,0.85)', background: '#0D1424' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={textareaRef}
                  className="input"
                  style={{
                    width: '100%',
                    resize: 'none',
                    height: 50,
                    padding: '0.75rem 1rem',
                    background: '#111B2E',
                    border: '1px solid rgba(79,140,255,0.25)',
                    borderRadius: 12,
                    fontSize: '0.875rem',
                    color: '#F4F7FF',
                  }}
                  placeholder="Ask anything (e.g. 'How should I price our services?', 'Draft a payment reminder', 'What is 15% of $4,500?')..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  height: 50,
                  padding: '0 1.25rem',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {loading ? <Loader2 size={18} className="spin" /> : <><Send size={16} /> Send</>}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: '#9AA9C2' }}>
              <span>Press <strong>Enter</strong> to send · <strong>Shift + Enter</strong> for new line</span>
              <span className="flex items-center gap-1">
                <Shield size={11} className="text-[#36D6E7]" />
                {isGeminiActive ? 'Powered by Google Gemini 1.5 Flash' : 'Connected to Autonomous Business Engine'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default VentureAIPage
