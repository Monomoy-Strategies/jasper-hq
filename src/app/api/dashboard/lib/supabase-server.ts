import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const userId = process.env.USER_ID!

if (!supabaseUrl || !supabaseServiceKey || !userId) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID')
}

// Create server-side client with service role key
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const USER_ID = userId