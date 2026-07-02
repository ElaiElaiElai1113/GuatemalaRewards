import { supabase } from '@/integrations/supabase/client'

/** Map a Supabase row (snake_case) to camelCase by converting keys. */
export function camelCaseRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    out[camel] = value
  }
  return out
}

/** Map a camelCase object to snake_case for Supabase inserts/updates. */
export function snakeCaseObj<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snake = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    out[snake] = value
  }
  return out
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || typeof value === 'undefined' || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Assert supabase is configured, throw a helpful error if not. */
export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your .env file.')
  }
  return supabase
}

export function friendlySupabaseError(error: { message?: string } | null | undefined, fallback: string) {
  const message = error?.message ?? fallback
  if (message.includes('identity_verification_required')) {
    return 'ID verification is required before using reward value actions.'
  }
  return message
}
