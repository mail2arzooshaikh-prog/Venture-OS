import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, CheckSquare, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_TASKS, SAMPLE_CLIENTS } from '../lib/sampleData'
import AppLayout from '../components/layout/AppLayout'
import Modal from '../components/ui/Modal'

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string
  completed_at: string | null
  client_id: string | null
  clients?: { name: string } | null
}

const PRIORITY_COLORS: Record<string,string> = { low:'status-badge-gray', medium:'status-badge-blue', high:'status-badge-amber', urgent:'status-badge-red' }

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—' }

const TasksPage: React.FC = () => {
  const { business, isDemoMode } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [statusFilter, setStatusFilter] = useState('active')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', client_id: '' })

  const load = useCallback(async () => {
    if (!business?.id) return
    setLoading(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const stored = localStorage.getItem('ventureos_demo_tasks')
      if (stored) {
        try { setTasks(JSON.parse(stored)) } catch { setTasks(SAMPLE_TASKS as unknown as Task[]) }
      } else {
        setTasks(SAMPLE_TASKS as unknown as Task[])
      }
      setClients(SAMPLE_CLIENTS.map(c => ({ id: c.id, name: c.name })))
      setLoading(false)
      return
    }

    const [tRes, cRes] = await Promise.all([
      supabase.from('tasks').select('*, clients(name)').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id,name').eq('business_id', business.id),
    ])
    setLoading(false)
    setTasks(tRes.data || [])
    setClients(cRes.data || [])
  }, [business?.id, isDemoMode])

  useEffect(() => { load() }, [load])

  const filtered = tasks.filter(t => {
    if (statusFilter === 'active') return t.status === 'todo' || t.status === 'in_progress'
    if (statusFilter === 'done') return t.status === 'done'
    return true
  })

  const markDone = async (id: string) => {
    if (!isSupabaseConfigured || isDemoMode) {
      const updated = tasks.map(t => t.id === id ? { ...t, status: 'done', completed_at: new Date().toISOString() } : t)
      localStorage.setItem('ventureos_demo_tasks', JSON.stringify(updated))
      setTasks(updated)
      return
    }
    await supabase.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('activity_log').insert({ business_id: business?.id, type: 'task_completed', title: 'Task completed', description: tasks.find(t => t.id === id)?.title || '' })
    load()
  }

  const save = async () => {
    if (!business?.id || !form.title.trim()) return
    setSaving(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const cliName = clients.find(c => c.id === form.client_id)?.name || null
      const newTask: Task = {
        id: `tsk-${Date.now()}`,
        title: form.title,
        description: form.description,
        priority: form.priority,
        due_date: form.due_date || new Date().toISOString().slice(0, 10),
        client_id: form.client_id || null,
        status: 'todo',
        completed_at: null,
        clients: cliName ? { name: cliName } : null,
      }
      const updated = [newTask, ...tasks]
      localStorage.setItem('ventureos_demo_tasks', JSON.stringify(updated))
      setTasks(updated)
      setSaving(false)
      setModalOpen(false)
      setForm({ title: '', description: '', priority: 'medium', due_date: '', client_id: '' })
      return
    }

    await supabase.from('tasks').insert({ business_id: business.id, title: form.title, description: form.description, priority: form.priority, due_date: form.due_date || null, client_id: form.client_id || null, status: 'todo' })
    setSaving(false)
    setModalOpen(false)
    setForm({ title: '', description: '', priority: 'medium', due_date: '', client_id: '' })
    load()
  }

  const todoCount = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length
  const doneCount = tasks.filter(t => t.status === 'done').length

  return (
    <AppLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Tasks</h1>
              {(!isSupabaseConfigured || isDemoMode) && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(79,140,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,140,255,0.2)' }}>
                  Demo Data
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{todoCount} open · {doneCount} done</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={18} /> Add Task</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[{ v: 'active', l: 'Active' }, { v: 'done', l: 'Completed' }, { v: 'all', l: 'All' }].map(s => (
            <button key={s.v} className={`btn btn-sm ${statusFilter === s.v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(s.v)}>{s.l}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Loader2 size={24} className="spin" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <CheckSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No tasks here</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Stay organized by tracking your work.</p>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Task</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map(t => (
              <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', opacity: t.status === 'done' ? 0.65 : 1 }}>
                <button onClick={() => t.status !== 'done' && markDone(t.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${t.status === 'done' ? 'var(--success)' : 'var(--border-medium)'}`, background: t.status === 'done' ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: t.status === 'done' ? 'default' : 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
                  {t.status === 'done' && <Check size={13} color="#fff" />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, textDecoration: t.status === 'done' ? 'line-through' : 'none', marginBottom: '0.1rem' }}>{t.title}</p>
                  {t.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.description}</p>}
                </div>
                {t.clients && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.clients.name}</span>}
                {t.due_date && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(t.due_date)}</span>}
                <span className={`status-badge ${PRIORITY_COLORS[t.priority] || 'status-badge-gray'}`} style={{ textTransform: 'capitalize', flexShrink: 0 }}>{t.priority}</span>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Task" size="md"
          footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <><Loader2 size={16} className="spin" />Saving…</> : 'Add Task'}</button>
          </div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" autoFocus /></div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details…" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {['low','medium','high','urgent'].map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
                </select>
              </div>
              <div><label className="label">Due Date</label><input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            </div>
            <div><label className="label">Client (optional)</label>
              <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">None</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}

export default TasksPage
