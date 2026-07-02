import { createClient } from 'npm:@supabase/supabase-js@2'

type ProvisionPartnerOwnerRequest = {
  businessId?: string
  businessName?: string
  email?: string
}

type ProfileRow = {
  id: string
  role: 'customer' | 'platform-admin' | 'business-owner' | 'business-staff'
  business_id: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const fallbackDefaultPassword = 'guatemalarewards2026!'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getSecretKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys) as Record<string, string>
      if (parsed.default) return parsed.default
    } catch {
      return null
    }
  }

  return Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}

function getDefaultPassword() {
  return Deno.env.get('PARTNER_DEFAULT_PASSWORD') ?? fallbackDefaultPassword
}

function cleanEmail(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

function generateReferralCode() {
  return `MR-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
}

async function findUserIdByEmail(admin: ReturnType<typeof createClient>, email: string) {
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle()

  if (profile?.id) return profile.id as string

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return user.id
    if (data.users.length < 1000) break
  }

  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ message: 'Method not allowed.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const secretKey = getSecretKey()
  if (!supabaseUrl || !secretKey) {
    return jsonResponse({ message: 'Supabase function secrets are not configured.' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return jsonResponse({ message: 'Missing Authorization bearer token.' }, 401)
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: userResult, error: userError } = await admin.auth.getUser(token)
  if (userError || !userResult.user) {
    return jsonResponse({ message: 'Invalid or expired session.' }, 401)
  }

  const { data: actorProfile, error: actorProfileError } = await admin
    .from('profiles')
    .select('id, role, business_id')
    .eq('id', userResult.user.id)
    .single()

  if (actorProfileError || !actorProfile) {
    return jsonResponse({ message: 'Actor profile not found.' }, 404)
  }

  if ((actorProfile as ProfileRow).role !== 'platform-admin') {
    return jsonResponse({ message: 'Only platform admins can create partner owner accounts.' }, 403)
  }

  let payload: ProvisionPartnerOwnerRequest
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ message: 'Invalid JSON payload.' }, 400)
  }

  const businessId = payload.businessId?.trim()
  const businessName = payload.businessName?.trim() || 'Partner'
  const email = cleanEmail(payload.email)
  const defaultPassword = getDefaultPassword()

  if (!businessId) {
    return jsonResponse({ message: 'Business is required.' }, 400)
  }

  if (!email || !email.includes('@')) {
    return jsonResponse({ message: 'A valid partner email is required.' }, 400)
  }

  if (defaultPassword.length < 6) {
    return jsonResponse({ message: 'Partner default password must be at least 6 characters.' }, 500)
  }

  const { data: business, error: businessError } = await admin
    .from('businesses')
    .select('id, name')
    .eq('id', businessId)
    .single()

  if (businessError || !business) {
    return jsonResponse({ message: 'Business not found.' }, 404)
  }

  const fullName = `${businessName} Owner`
  let userId = await findUserIdByEmail(admin, email)
  let accountCreated = false

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      app_metadata: {
        role: 'business-owner',
        business_id: businessId,
      },
      user_metadata: {
        full_name: fullName,
        business_id: businessId,
      },
    })

    if (createError || !created.user) {
      if (!createError?.message.toLowerCase().includes('already')) {
        return jsonResponse(
          { message: createError?.message ?? 'Partner owner account could not be created.' },
          409,
        )
      }

      userId = await findUserIdByEmail(admin, email)
      if (!userId) {
        return jsonResponse({ message: 'Partner email already exists, but the account could not be found.' }, 409)
      }
    } else {
      userId = created.user.id
      accountCreated = true
    }
  }

  const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
    email,
    password: defaultPassword,
    app_metadata: {
      role: 'business-owner',
      business_id: businessId,
    },
    user_metadata: {
      full_name: fullName,
      business_id: businessId,
    },
  })

  if (updateUserError) {
    return jsonResponse({ message: updateUserError.message }, 500)
  }

  const { data: existingProfile, error: existingProfileError } = await admin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfileError) {
    return jsonResponse({ message: existingProfileError.message }, 500)
  }

  const profileWrite = existingProfile
    ? admin
        .from('profiles')
        .update({
          full_name: fullName,
          email,
          role: 'business-owner',
          business_id: businessId,
        })
        .eq('id', userId)
    : admin
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          email,
          role: 'business-owner',
          business_id: businessId,
          referral_code: generateReferralCode(),
        })

  const { error: profileWriteError } = await profileWrite

  if (profileWriteError) {
    return jsonResponse({ message: profileWriteError.message }, 500)
  }

  const { data: previousOwners, error: previousOwnersError } = await admin
    .from('profiles')
    .select('id')
    .eq('business_id', businessId)
    .eq('role', 'business-owner')
    .neq('id', userId)

  if (previousOwnersError) {
    return jsonResponse({ message: previousOwnersError.message }, 500)
  }

  const { error: previousOwnerProfileError } = await admin
    .from('profiles')
    .update({ role: 'business-staff', business_id: businessId })
    .eq('business_id', businessId)
    .eq('role', 'business-owner')
    .neq('id', userId)

  if (previousOwnerProfileError) {
    return jsonResponse({ message: previousOwnerProfileError.message }, 500)
  }

  for (const previousOwner of previousOwners ?? []) {
    const previousOwnerId = (previousOwner as { id?: string }).id
    if (!previousOwnerId) continue

    const { error: previousOwnerAuthError } = await admin.auth.admin.updateUserById(previousOwnerId, {
      app_metadata: {
        role: 'business-staff',
        business_id: businessId,
      },
    })

    if (previousOwnerAuthError) {
      return jsonResponse({ message: previousOwnerAuthError.message }, 500)
    }
  }

  const { error: businessUpdateError } = await admin
    .from('businesses')
    .update({ owner_profile_id: userId })
    .eq('id', businessId)

  if (businessUpdateError) {
    return jsonResponse({ message: businessUpdateError.message }, 500)
  }

  return jsonResponse({
    email,
    defaultPassword,
    userId,
    businessId,
    accountCreated,
  })
})
