import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

type EarlyAccessLeadRequest = {
  fullName?: unknown
  email?: unknown
  whatsapp?: unknown
  notes?: unknown
  marketingConsent?: unknown
}

function sendJson(response: VercelResponse, status: number, body: Record<string, unknown>) {
  response.status(status).json(body)
}

function parseRequestBody(body: unknown): EarlyAccessLeadRequest {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as EarlyAccessLeadRequest
    } catch {
      return {}
    }
  }

  if (body && typeof body === 'object') {
    return body as EarlyAccessLeadRequest
  }

  return {}
}

function cleanOptionalString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  const config = getSupabaseConfig()

  if (!config) {
    console.error('Early access lead Supabase configuration is missing.')
    sendJson(response, 500, { ok: false, error: 'Lead capture is not configured' })
    return
  }

  const body = parseRequestBody(request.body)
  const fullName = cleanOptionalString(body.fullName)
  const email = cleanOptionalString(body.email).toLowerCase()
  const whatsapp = cleanOptionalString(body.whatsapp)
  const notes = cleanOptionalString(body.notes)

  if (!email && !whatsapp) {
    sendJson(response, 400, { ok: false, error: 'Add an email or WhatsApp number.' })
    return
  }

  if (body.marketingConsent !== true) {
    sendJson(response, 400, { ok: false, error: 'Contact consent is required.' })
    return
  }

  const supabase = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase.rpc('create_early_access_lead', {
    p_full_name: fullName || null,
    p_email: email || null,
    p_whatsapp: whatsapp || null,
    p_notes: notes,
    p_marketing_consent: true,
    p_source: 'early-access-page',
  })

  if (error || !data) {
    console.error('Failed to create early access lead.', {
      message: error?.message ?? 'No lead returned',
    })
    sendJson(response, 502, { ok: false, error: error?.message ?? 'Unable to join the early access list.' })
    return
  }

  sendJson(response, 200, { ok: true, lead: data as Record<string, unknown> })
}
