import { createClient } from '@supabase/supabase-js'

// Client avec le service role key — bypass RLS, à utiliser uniquement côté serveur
// NE JAMAIS exposer ce client au navigateur
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
