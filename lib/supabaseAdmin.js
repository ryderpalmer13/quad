import { createClient } from '@supabase/supabase-js'

let admin = null

// Server only. Uses the service role key, which can do anything, so it must never reach the browser.
export function getAdmin() {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase server keys are not set')
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return admin
}

// Works out who is calling an API route from the login token the browser sends.
export async function getUserFromRequest(req) {
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  const { data, error } = await getAdmin().auth.getUser(token)
  if (error || !data || !data.user) return null
  return data.user
}
