import { supabase } from './supabase'

// ── Base URL ──────────────────────────────────────────────────────────────────
const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

// ── Response interfaces ───────────────────────────────────────────────────────

export interface VisionExtractedData {
  document_type?: string
  vendor?: string
  amount?: number
  currency?: string
  date?: string
  line_items?: Array<{ description: string; quantity?: number; unit_price?: number; total?: number }>
  tax?: number
  total?: number
  notes?: string
  [key: string]: unknown
}

export interface VisionResponse {
  success: boolean
  documentType?: string
  confidence?: number
  extractedData?: Record<string, any>
  warnings?: string[]
  requiresConfig?: boolean
  captureAvailable?: boolean
  message?: string
  error?: string
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  success: boolean
  response?: string   // from server /api/ai/chat
  message?: string    // fallback or error message
  requiresConfig?: boolean
  suggestions?: string[]
  error?: string
}

export interface Insight {
  type: 'revenue' | 'expense' | 'client' | 'task' | 'general'
  title: string
  description: string
  value?: number | string
  change?: number
  priority?: 'low' | 'medium' | 'high'
}

export interface InsightsResponse {
  success: boolean
  insights: Array<{ title: string; description: string; type: string; priority: string }>
  requiresConfig?: boolean
  generated_at?: string
  error?: string
}

export interface HealthResponse {
  status: string
  version?: string
  timestamp?: string
  services?: { gemini: boolean; supabase: boolean }
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` }
    }
  } catch {
    // Supabase might not be configured — silently return empty
  }
  return {}
}

// ── Generic fetch wrapper ─────────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, headers: extraHeaders, ...rest } = options

  const authHeaders = skipAuth ? {} : await getAuthHeader()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(extraHeaders as Record<string, string>),
    },
  })

  if (!response.ok) {
    let errorMessage = `API error ${response.status}: ${response.statusText}`
    try {
      const errorBody = (await response.json()) as { message?: string; error?: string }
      errorMessage = errorBody.message ?? errorBody.error ?? errorMessage
    } catch {
      // Body was not JSON — use the status text
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}

// ── Public API functions ──────────────────────────────────────────────────────

/**
 * Upload a document image/PDF for AI-powered data extraction.
 * Sends multipart/form-data — Content-Type must NOT be overridden so the
 * browser sets the correct boundary.
 */
export async function processDocument(formData: FormData): Promise<VisionResponse> {
  try {
    const authHeaders = await getAuthHeader()

    const response = await fetch(`${BASE_URL}/api/vision/process`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        // Do NOT set Content-Type — browser sets it with the multipart boundary
      },
      body: formData,
    })

    if (!response.ok) {
      let msg = `API error ${response.status}`
      try {
        const body = (await response.json()) as { message?: string; error?: string }
        msg = body.message ?? body.error ?? msg
      } catch {
        // ignore
      }
      return { success: false, extractedData: {}, error: msg }
    }

    return response.json() as Promise<VisionResponse>
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    console.error('[api] processDocument error:', message)
    return {
      success: false,
      extractedData: {},
      error: message,
    }
  }
}

/**
 * Send a message to the VentureAI assistant.
 * Note: Financial and business context is derived strictly by the backend
 * from the authenticated user's records to prevent tampering.
 */
export async function sendAIMessage(
  message: string,
  history: AIMessage[] = [],
): Promise<AIResponse> {
  try {
    return await apiRequest<AIResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Network error'
    console.error('[api] sendAIMessage error:', error)
    return { success: false, message: '', error }
  }
}

/**
 * Fetch AI-generated business insights for the current user.
 */
export async function getAIInsights(): Promise<InsightsResponse> {
  try {
    return await apiRequest<InsightsResponse>('/api/ai/insights')
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Network error'
    console.error('[api] getAIInsights error:', error)
    return { success: false, insights: [], error }
  }
}

/**
 * Health check — can be called without authentication.
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    return await apiRequest<HealthResponse>('/api/health', { skipAuth: true })
  } catch (err) {
    console.error('[api] checkHealth error:', err)
    return { status: 'down' }
  }
}
