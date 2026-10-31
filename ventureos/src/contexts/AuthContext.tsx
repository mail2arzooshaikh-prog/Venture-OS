import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Business {
  id: string
  user_id: string
  name: string
  category: string
  stage: string
  currency: string
  primary_goal: string
  onboarding_completed: boolean
}

export interface AuthContextType {
  user: User | null
  business: Business | null
  session: Session | null
  loading: boolean
  isDemoMode: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: Error | null; user: User | null }>
  signOut: () => Promise<void>
  updateBusiness: (updates: Partial<Business>) => Promise<{ error: Error | null }>
  refreshBusiness: () => Promise<void>
  enterDemoMode: () => void
}

// ── Demo defaults ─────────────────────────────────────────────────────────────

const DEMO_USER: User = {
  id: 'demo-user-id-001',
  app_metadata: {},
  user_metadata: { full_name: 'Alex Mercer' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'demo@ventureos.io',
} as User

const DEMO_BUSINESS: Business = {
  id: 'demo-biz-id-001',
  user_id: 'demo-user-id-001',
  name: 'Nexus Dynamics',
  category: 'startup',
  stage: 'growing',
  currency: 'INR',
  primary_goal: 'All of the above',
  onboarding_completed: true,
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const fetchBusiness = useCallback(async (userId: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      const savedBiz = localStorage.getItem('ventureos_demo_business')
      if (savedBiz) {
        try { setBusiness(JSON.parse(savedBiz)) } catch { setBusiness(DEMO_BUSINESS) }
      } else {
        setBusiness(DEMO_BUSINESS)
      }
      return
    }

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('[AuthContext] fetchBusiness error:', error.message)
        return
      }

      setBusiness((data as Business) ?? null)
    } catch (err) {
      console.error('[AuthContext] fetchBusiness unexpected error:', err)
    }
  }, [])

  const enterDemoMode = useCallback(() => {
    localStorage.setItem('ventureos_demo_session', 'true')
    const savedBiz = localStorage.getItem('ventureos_demo_business')
    let biz = DEMO_BUSINESS
    if (savedBiz) {
      try { biz = JSON.parse(savedBiz) } catch { /* ignore */ }
    }
    setUser(DEMO_USER)
    setBusiness(biz)
    setIsDemoMode(true)
    setLoading(false)
  }, [])

  // ── Session bootstrap ──────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        // Check for local demo session first
        const hasDemoSession = localStorage.getItem('ventureos_demo_session') === 'true'
        if (hasDemoSession || !isSupabaseConfigured) {
          if (hasDemoSession) {
            enterDemoMode()
            return
          }
        }

        if (isSupabaseConfigured) {
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession()

          if (!mounted) return

          setSession(currentSession)
          setUser(currentSession?.user ?? null)

          if (currentSession?.user) {
            await fetchBusiness(currentSession.user.id)
          }
        }
      } catch (err) {
        console.error('[AuthContext] bootstrap error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void bootstrap()

    // Listen for auth state changes if configured
    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchBusiness(newSession.user.id)
        } else {
          setBusiness(null)
        }

        setLoading(false)
      })

      return () => {
        mounted = false
        subscription.unsubscribe()
      }
    }
  }, [fetchBusiness, enterDemoMode])

  // ── Auth operations ────────────────────────────────────────────────────────

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        // In demo/unconfigured mode, accept any non-empty credentials or default demo
        enterDemoMode()
        return { error: null }
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ? new Error(error.message) : null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign-in failed') }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
  ): Promise<{ error: Error | null; user: User | null }> => {
    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        // Fallback for demo mode
        const newUser: User = {
          ...DEMO_USER,
          email,
          user_metadata: { full_name: name },
        } as User
        const newBiz: Business = {
          ...DEMO_BUSINESS,
          name: `${name}'s Business`,
          onboarding_completed: false,
        }
        localStorage.setItem('ventureos_demo_session', 'true')
        localStorage.setItem('ventureos_demo_business', JSON.stringify(newBiz))
        setUser(newUser)
        setBusiness(newBiz)
        setIsDemoMode(true)
        return { error: null, user: newUser }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      })

      return {
        error: error ? new Error(error.message) : null,
        user: data.user ?? null,
      }
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Sign-up failed'),
        user: null,
      }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    setLoading(true)
    try {
      localStorage.removeItem('ventureos_demo_session')
      if (isSupabaseConfigured) {
        await supabase.auth.signOut()
      }
    } finally {
      setUser(null)
      setSession(null)
      setBusiness(null)
      setIsDemoMode(false)
      setLoading(false)
    }
  }

  const updateBusiness = async (
    updates: Partial<Business>,
  ): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') }

    try {
      if (!isSupabaseConfigured || isDemoMode) {
        const merged = { ...(business || DEMO_BUSINESS), ...updates }
        localStorage.setItem('ventureos_demo_business', JSON.stringify(merged))
        setBusiness(merged)
        return { error: null }
      }

      const payload = { ...updates, user_id: user.id }

      const { error } = await supabase
        .from('businesses')
        .upsert(payload, { onConflict: 'user_id' })

      if (error) return { error: new Error(error.message) }

      // Refresh local state
      await fetchBusiness(user.id)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Update failed') }
    }
  }

  const refreshBusiness = async (): Promise<void> => {
    if (user) await fetchBusiness(user.id)
  }

  // ── Context value ──────────────────────────────────────────────────────────

  const value: AuthContextType = {
    user,
    business,
    session,
    loading,
    isDemoMode,
    signIn,
    signUp,
    signOut,
    updateBusiness,
    refreshBusiness,
    enterDemoMode,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
