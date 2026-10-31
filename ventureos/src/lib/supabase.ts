import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured: boolean =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey)

function createMockClient(): SupabaseClient {
  const warn = (method: string) =>
    console.warn(
      `[VentureOS] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. Called: supabase.${method}`,
    )

  // Return a Proxy that intercepts every property access and returns a no-op
  // chain so the app doesn't crash when Supabase env vars are missing.
  const noop = (..._args: unknown[]) => {
    warn('(unknown method)')
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  }

  const noopChain: Record<string, unknown> = new Proxy(
    {},
    {
      get(_target, prop: string) {
        warn(prop)
        // Support .auth.getSession(), .from().select() etc.
        return new Proxy(noop, {
          get(_fn, inner: string) {
            warn(`${prop}.${inner}`)
            return noopChain[inner] ?? noop
          },
          apply(_fn, _thisArg, args) {
            warn(`${prop}(${args.join(', ')})`)
            return {
              data: null,
              error: new Error('Supabase not configured'),
              // Support promise chaining
              then: (cb: (v: unknown) => unknown) =>
                Promise.resolve({ data: null, error: new Error('Supabase not configured') }).then(cb),
            }
          },
        })
      },
    },
  )

  return noopChain as unknown as SupabaseClient
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createMockClient()
