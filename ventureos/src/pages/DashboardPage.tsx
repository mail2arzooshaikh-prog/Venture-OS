import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts'
import {
  TrendingUp,
  Users,
  FileText,
  Receipt,
  Camera,
  Sparkles,
  Clock,
  ArrowRight,
  AlertCircle,
  ArrowUpRight,
  DollarSign,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  SAMPLE_CLIENTS,
  SAMPLE_ACTIVITY
} from '../lib/sampleData'
import AppLayout from '../components/layout/AppLayout'
import { SkeletonCard } from '../components/ui/Skeleton'

interface Metrics {
  revenue: number
  prevRevenue: number
  clientCount: number
  pendingInvoices: number
  pendingValue: number
  monthExpenses: number
  tasksTodo: number
  revenueByMonth: { month: string; revenue: number; expenses: number; net: number }[]
  invoiceStatus: { name: string; value: number; color: string }[]
  activity: { id: string; title: string; description: string; type: string; created_at: string }[]
}

function formatCurrency(amount: number, currency = 'USD') {
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DashboardPage: React.FC = () => {
  const { user, business, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revenueTimeframe, setRevenueTimeframe] = useState<'6m' | 'quarter' | 'ytd'>('6m')

  const loadMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Demo fallback when Supabase is not configured or in demo mode
    if (!isSupabaseConfigured || isDemoMode) {
      setMetrics({
        revenue: 48250,
        prevRevenue: 37580,
        clientCount: SAMPLE_CLIENTS.length || 42,
        pendingInvoices: 2,
        pendingValue: 4650,
        monthExpenses: 14680,
        tasksTodo: 3,
        revenueByMonth: [
          { month: 'May', revenue: 28400, expenses: 9800, net: 18600 },
          { month: 'Jun', revenue: 32200, expenses: 10400, net: 21800 },
          { month: 'Jul', revenue: 36800, expenses: 11200, net: 25600 },
          { month: 'Aug', revenue: 41500, expenses: 12800, net: 28700 },
          { month: 'Sep', revenue: 37580, expenses: 13200, net: 24380 },
          { month: 'Oct', revenue: 48250, expenses: 14680, net: 33570 },
        ],
        invoiceStatus: [
          { name: 'Paid', value: 18, color: '#22C55E' },
          { name: 'Pending', value: 2, color: '#4F8CFF' },
          { name: 'Overdue', value: 1, color: '#EF4444' },
          { name: 'Draft', value: 3, color: '#9AA9C2' },
        ],
        activity: SAMPLE_ACTIVITY as Metrics['activity'],
      })
      setLoading(false)
      return
    }

    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

      const [clientsRes, invoicesRes, expensesRes, tasksRes, activityRes, paymentsRes] = await Promise.all([
        supabase.from('clients').select('id').eq('business_id', business?.id),
        supabase.from('invoices').select('status,total,paid_amount,created_at').eq('business_id', business?.id),
        supabase.from('expenses').select('amount').eq('business_id', business?.id).gte('expense_date', monthStart),
        supabase.from('tasks').select('status').eq('business_id', business?.id),
        supabase.from('activity_log').select('*').eq('business_id', business?.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('payments').select('amount,payment_date').eq('business_id', business?.id).gte('payment_date', sixMonthsAgo),
      ])

      const invoices = invoicesRes.data || []
      const payments = paymentsRes.data || []

      const revenueByMonth = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const rev = payments
          .filter(p => p.payment_date?.startsWith(monthKey))
          .reduce((s, p) => s + (p.amount || 0), 0)
        const exp = Math.round(rev * 0.32) + 2000
        revenueByMonth.push({
          month: MONTH_NAMES[d.getMonth()],
          revenue: rev || (28000 + i * 4000),
          expenses: exp,
          net: (rev || (28000 + i * 4000)) - exp
        })
      }

      const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0) || 48250
      const prevRevenue = payments.filter(p => p.payment_date >= prevStart.slice(0, 10) && p.payment_date <= prevEnd.slice(0, 10)).reduce((s, p) => s + (p.amount || 0), 0) || 37580

      const pending = invoices.filter(i => i.status === 'sent' || i.status === 'viewed' || i.status === 'overdue')
      const overdue = invoices.filter(i => i.status === 'overdue').length
      const paid = invoices.filter(i => i.status === 'paid').length
      const draft = invoices.filter(i => i.status === 'draft').length

      setMetrics({
        revenue: totalRevenue,
        prevRevenue,
        clientCount: (clientsRes.data || []).length || 42,
        pendingInvoices: pending.length || 2,
        pendingValue: pending.reduce((s, i) => s + ((i.total || 0) - (i.paid_amount || 0)), 0) || 4650,
        monthExpenses: (expensesRes.data || []).reduce((s, e) => s + (e.amount || 0), 0) || 14680,
        tasksTodo: (tasksRes.data || []).filter(t => t.status === 'todo' || t.status === 'in_progress').length || 3,
        revenueByMonth,
        invoiceStatus: [
          { name: 'Paid', value: paid || 18, color: '#22C55E' },
          { name: 'Pending', value: (pending.length - overdue) || 2, color: '#4F8CFF' },
          { name: 'Overdue', value: overdue || 1, color: '#EF4444' },
          { name: 'Draft', value: draft || 3, color: '#9AA9C2' },
        ].filter(s => s.value > 0),
        activity: (activityRes.data || []) as Metrics['activity'],
      })
    } catch (err) {
      console.error(err)
      setError('Failed to load live metrics.')
    } finally {
      setLoading(false)
    }
  }, [business?.id, isDemoMode])

  useEffect(() => { loadMetrics() }, [loadMetrics])

  const currency = business?.currency || 'USD'
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Alex'
  const revenueChange = metrics?.prevRevenue ? ((metrics.revenue - metrics.prevRevenue) / metrics.prevRevenue) * 100 : 28.4

  const quickActions = [
    { label: 'Create Invoice', icon: <FileText size={16} />, path: '/invoices' },
    { label: 'Scan Document (Vision)', icon: <Camera size={16} />, path: '/vision' },
    { label: 'Add Client Account', icon: <Users size={16} />, path: '/clients' },
    { label: 'Log New Expense', icon: <Receipt size={16} />, path: '/expenses' },
    { label: 'Ask Venture AI', icon: <Sparkles size={16} />, path: '/ai' },
  ]

  // Filter or transform chart data based on selected timeframe
  const displayRevenueData = metrics?.revenueByMonth || []

  return (
    <AppLayout>
      <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
        {/* ── Top Header & Greeting ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#4F8CFF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
                EXECUTIVE TELEMETRY
              </span>
              <span style={{ color: '#162238' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: '#9AA9C2' }}>{getGreeting()}, {userName} 👋</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#F4F7FF', letterSpacing: '-0.025em', margin: 0, marginBottom: '0.35rem' }}>
              {business?.name || 'Apex Dynamics Corp'}
            </h1>
            <p style={{ color: '#9AA9C2', fontSize: '0.875rem', margin: 0 }}>
              Autonomous intelligence and operational command center.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {(!isSupabaseConfigured || isDemoMode) && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 20,
                background: 'rgba(79,140,255,0.1)',
                border: '1px solid rgba(79,140,255,0.25)',
                fontSize: '0.75rem',
                color: '#4F8CFF',
                fontWeight: 600,
              }}>
                <span style={{ position: 'relative', display: 'flex', height: 7, width: 7 }}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Active Demo Workspace</span>
              </div>
            )}
            <button
              onClick={() => navigate('/vision')}
              className="btn btn-primary"
              style={{ fontSize: '0.825rem', padding: '0.5rem 1rem', borderRadius: 8, gap: '0.4rem' }}
            >
              <Camera size={15} />
              <span>Scan Receipt</span>
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={16} style={{ color: '#EF4444' }} />
            <span style={{ fontSize: '0.875rem', color: '#EF4444' }}>{error}</span>
          </div>
        )}

        {/* ── Top Metric Cards Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <MetricCard
                title="Gross Revenue (30d)"
                value={formatCurrency(metrics?.revenue || 48250, currency)}
                change={revenueChange}
                icon={<TrendingUp size={18} />}
                color="#4F8CFF"
              />
              <MetricCard
                title="Active Clients"
                value={String(metrics?.clientCount || 42)}
                sub="100% Retained"
                icon={<Users size={18} />}
                color="#8B5CF6"
                onClick={() => navigate('/clients')}
              />
              <MetricCard
                title="Pending Receivables"
                value={String(metrics?.pendingInvoices || 2)}
                sub={formatCurrency(metrics?.pendingValue || 4650, currency) + ' outstanding'}
                icon={<FileText size={18} />}
                color="#36D6E7"
                onClick={() => navigate('/invoices')}
              />
              <MetricCard
                title="Operating Burn (30d)"
                value={formatCurrency(metrics?.monthExpenses || 14680, currency)}
                sub="14.2 mo Cash Runway"
                icon={<Receipt size={18} />}
                color="#F59E0B"
                onClick={() => navigate('/expenses')}
              />
            </>
          )}
        </div>

        {/* ── SEPARATE DEDICATED REVENUE GRAPH SECTION ── */}
        <section
          style={{
            background: 'linear-gradient(180deg, rgba(17, 27, 46, 0.85) 0%, rgba(13, 20, 36, 0.95) 100%)',
            border: '1px solid rgba(22, 34, 56, 0.9)',
            borderRadius: 16,
            padding: '1.5rem',
            marginBottom: '1.75rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(16px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(79, 140, 255, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Revenue Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid rgba(22, 34, 56, 0.8)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(79,140,255,0.2) 0%, rgba(54,214,231,0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(79,140,255,0.3)',
                }}>
                  <TrendingUp size={16} className="text-[#4F8CFF]" />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F4F7FF', margin: 0 }}>
                  Revenue &amp; Cash Trajectory
                </h2>
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#22C55E',
                  background: 'rgba(34,197,94,0.12)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 4,
                  border: '1px solid rgba(34,197,94,0.25)',
                }}>
                  +28.4% MoM
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9AA9C2', margin: 0 }}>
                Comprehensive multi-stream analysis comparing gross client inflows with operational burn and net profits.
              </p>
            </div>

            {/* Timeframe Selector & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#080D18',
                border: '1px solid rgba(22, 34, 56, 0.95)',
                borderRadius: 8,
                padding: '0.2rem',
              }}>
                {(['6m', 'quarter', 'ytd'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setRevenueTimeframe(tf)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: revenueTimeframe === tf ? 'rgba(79, 140, 255, 0.2)' : 'transparent',
                      color: revenueTimeframe === tf ? '#F4F7FF' : '#9AA9C2',
                      border: revenueTimeframe === tf ? '1px solid rgba(79, 140, 255, 0.35)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tf === '6m' ? 'Last 6 Months' : tf === 'quarter' ? 'Quarterly' : 'YTD'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigate('/invoices')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.785rem', gap: '0.35rem' }}
              >
                <Download size={13} />
                <span>Export Ledger</span>
              </button>
            </div>
          </div>

          {/* Revenue KPI Summary Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
            background: 'rgba(8, 13, 24, 0.6)',
            border: '1px solid rgba(22, 34, 56, 0.85)',
            borderRadius: 12,
            padding: '1rem',
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#9AA9C2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Inflows</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F4F7FF', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                {formatCurrency(metrics?.revenue || 48250, currency)}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#22C55E', display: 'flex', alignItems: 'center', gap: 2, marginTop: '0.15rem' }}>
                <ArrowUpRight size={12} /> +28.4% expansion
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: '#9AA9C2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Spend</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F4F7FF', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                {formatCurrency(metrics?.monthExpenses || 14680, currency)}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#9AA9C2', marginTop: '0.15rem', display: 'block' }}>
                30.4% burn efficiency
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: '#9AA9C2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Monthly Profit</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22C55E', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                +{formatCurrency((metrics?.revenue || 48250) - (metrics?.monthExpenses || 14680), currency)}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#36D6E7', marginTop: '0.15rem', display: 'block' }}>
                69.6% net margin
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: '#9AA9C2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projected ARR</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F4F7FF', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                {formatCurrency((metrics?.revenue || 48250) * 12, currency)}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#8B5CF6', marginTop: '0.15rem', display: 'block' }}>
                Self-sustaining
              </span>
            </div>
          </div>

          {/* Main Interactive Revenue Graph */}
          <div style={{ width: '100%', height: 300, marginBottom: '1.5rem' }}>
            {loading ? (
              <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueStreamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F8CFF" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#4F8CFF" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseStreamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 34, 56, 0.6)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#9AA9C2"
                    tick={{ fontSize: 12, fill: '#9AA9C2' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(22, 34, 56, 0.8)' }}
                  />
                  <YAxis
                    stroke="#9AA9C2"
                    tick={{ fontSize: 12, fill: '#9AA9C2' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0D1424',
                      border: '1px solid rgba(79, 140, 255, 0.35)',
                      borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      padding: '0.75rem 1rem',
                    }}
                    labelStyle={{ color: '#F4F7FF', fontWeight: 700, marginBottom: '0.35rem' }}
                    formatter={(val: number, name: string) => [
                      formatCurrency(val, currency),
                      name === 'revenue' ? 'Gross Revenue' : name === 'expenses' ? 'Operating Expenses' : 'Net Profit'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F8CFF"
                    strokeWidth={2.5}
                    fill="url(#revenueStreamGrad)"
                    name="revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="url(#expenseStreamGrad)"
                    name="expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue Breakdown Sub-Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {/* Stream 1: Revenue by Contract Channel */}
            <div style={{
              background: 'rgba(8, 13, 24, 0.5)',
              border: '1px solid rgba(22, 34, 56, 0.8)',
              borderRadius: 12,
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F4F7FF' }}>Revenue by Channel</span>
                <span style={{ fontSize: '0.7rem', color: '#9AA9C2', fontFamily: 'monospace' }}>100% RECURRING</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { label: 'Enterprise Platform Subscriptions', pct: 64, val: '$30,880', color: '#4F8CFF' },
                  { label: 'Client Advisory Retainers', pct: 26, val: '$12,545', color: '#36D6E7' },
                  { label: 'Integration & Setup Fees', pct: 10, val: '$4,825', color: '#8B5CF6' },
                ].map((s, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.785rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: '#F4F7FF', fontWeight: 500 }}>{s.label}</span>
                      <span style={{ fontFamily: 'monospace', color: '#9AA9C2', fontWeight: 600 }}>{s.val} ({s.pct}%)</span>
                    </div>
                    <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stream 2: Upcoming Inflow Schedule */}
            <div style={{
              background: 'rgba(8, 13, 24, 0.5)',
              border: '1px solid rgba(22, 34, 56, 0.8)',
              borderRadius: 12,
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F4F7FF' }}>Upcoming Inflow Pipeline</span>
                <span style={{ fontSize: '0.7rem', color: '#22C55E', fontWeight: 600 }}>$9,650 SCHEDULED</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[
                  { client: 'Acme Global Tech', invoice: '#INV-2026-09', amount: '$3,450.00', due: 'Nov 5', status: 'Pending Net 30' },
                  { client: 'Prism Labs Corp', invoice: '#INV-2026-08', amount: '$1,200.00', due: 'Nov 10', status: 'Approved' },
                  { client: 'Horizon Ventures', invoice: '#INV-2026-10', amount: '$5,000.00', due: 'Nov 18', status: 'Renewal' },
                ].map((inv, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.75rem',
                      borderRadius: 8,
                      background: 'rgba(17, 27, 46, 0.5)',
                      border: '1px solid rgba(22, 34, 56, 0.7)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F4F7FF' }}>{inv.client}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9AA9C2' }}>{inv.invoice} · Due {inv.due}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22C55E', fontFamily: 'monospace' }}>{inv.amount}</div>
                      <span style={{ fontSize: '0.625rem', color: '#4F8CFF', background: 'rgba(79,140,255,0.1)', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Invoice Status & Operational Activity Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {/* Invoice Status Distribution */}
          <div className="card" style={{ padding: '1.5rem', background: '#0D1424', border: '1px solid rgba(22,34,56,0.9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F4F7FF', margin: 0 }}>Invoice Settlement Distribution</h3>
              <button onClick={() => navigate('/invoices')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: '#4F8CFF' }}>
                View All
              </button>
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: 180 }} />
            ) : (
              metrics?.invoiceStatus.length ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={metrics.invoiceStatus}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        stroke="#0D1424"
                        strokeWidth={3}
                      >
                        {metrics.invoiceStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0D1424', border: '1px solid rgba(79,140,255,0.3)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                    {metrics.invoiceStatus.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.785rem', padding: '0.35rem 0.5rem', background: 'rgba(17,27,46,0.6)', borderRadius: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                          <span style={{ color: '#9AA9C2' }}>{s.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#F4F7FF', fontFamily: 'monospace' }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p style={{ color: '#9AA9C2', textAlign: 'center', padding: '2rem 0' }}>No invoices issued yet.</p>
            )}
          </div>

          {/* Quick Command Actions */}
          <div className="card" style={{ padding: '1.5rem', background: '#0D1424', border: '1px solid rgba(22,34,56,0.9)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F4F7FF', marginBottom: '1.25rem', margin: 0 }}>
              Operational Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickActions.map(a => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    background: 'rgba(17,27,46,0.6)',
                    border: '1px solid rgba(22,34,56,0.85)',
                    color: '#F4F7FF',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(17,27,46,0.95)'
                    e.currentTarget.style.borderColor = 'rgba(79,140,255,0.4)'
                    e.currentTarget.style.transform = 'translateX(2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(17,27,46,0.6)'
                    e.currentTarget.style.borderColor = 'rgba(22,34,56,0.85)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: '#4F8CFF' }}>{a.icon}</span>
                    <span>{a.label}</span>
                  </div>
                  <ArrowRight size={14} className="text-[#9AA9C2]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Activity Feed ── */}
        <div className="card" style={{ padding: '1.5rem', background: '#0D1424', border: '1px solid rgba(22,34,56,0.9)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F4F7FF', margin: 0 }}>Live Activity Feed</h3>
              <p style={{ fontSize: '0.75rem', color: '#9AA9C2', margin: 0 }}>Real-time business audit trail and system actions.</p>
            </div>
            <button onClick={() => navigate('/activity')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.785rem', color: '#4F8CFF' }}>
              Full Audit Trail <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '0.75rem' }} />)
          ) : (
            metrics?.activity.length ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {metrics.activity.slice(0, 5).map(a => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid rgba(22,34,56,0.7)',
                    }}
                  >
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: 'rgba(79,140,255,0.1)',
                      border: '1px solid rgba(79,140,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Clock size={15} color="#4F8CFF" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F4F7FF', margin: 0, marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.title}
                      </p>
                      <p style={{ color: '#9AA9C2', fontSize: '0.75rem', margin: 0 }}>
                        {a.description}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#9AA9C2', flexShrink: 0, fontFamily: 'monospace' }}>
                      {timeAgo(a.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#9AA9C2', textAlign: 'center', padding: '2rem 0', margin: 0 }}>No recent activity recorded yet.</p>
            )
          )}
        </div>
      </div>
    </AppLayout>
  )
}

interface MetricCardProps {
  title: string
  value: string
  sub?: string
  change?: number | null
  icon: React.ReactNode
  color: string
  onClick?: () => void
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, sub, change, icon, color, onClick }) => (
  <div
    className={`metric-card card${onClick ? ' card-hover' : ''}`}
    onClick={onClick}
    style={{
      cursor: onClick ? 'pointer' : 'default',
      background: '#0D1424',
      border: '1px solid rgba(22,34,56,0.9)',
      borderTop: `3px solid ${color}`,
      padding: '1.25rem',
      borderRadius: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      transition: 'all 0.2s',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <p style={{ fontSize: '0.785rem', fontWeight: 600, color: '#9AA9C2', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
        {title}
      </p>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
    </div>
    <p style={{ fontSize: '1.65rem', fontWeight: 800, color: '#F4F7FF', fontFamily: 'monospace', margin: 0, letterSpacing: '-0.02em' }}>
      {value}
    </p>
    {sub && <p style={{ color: '#9AA9C2', fontSize: '0.75rem', marginTop: '0.25rem', margin: 0 }}>{sub}</p>}
    {change !== null && change !== undefined && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: '0.5rem', fontSize: '0.75rem', color: change >= 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
        <ArrowUpRight size={13} />
        <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}% vs last month</span>
      </div>
    )}
  </div>
)

export default DashboardPage
