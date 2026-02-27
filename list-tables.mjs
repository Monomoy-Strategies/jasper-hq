import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const key = l.split('=')[0].trim()
      const val = l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')
      return [key, val]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await supabase.rpc('version')
console.log('Connected:', !error)

// Try known table names
for (const table of ['tasks', 'todos', 'action_items', 'jasper_tasks', 'agent_tasks', 'board_tasks']) {
  const { error: e } = await supabase.from(table).select('id').limit(1)
  if (!e) console.log('✅ Found table:', table)
}
