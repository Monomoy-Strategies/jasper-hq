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

const BILL_USER_ID = '1cfef549-ae52-4824-808b-7bfafb303adc'
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const tasks = [
  {
    user_id: BILL_USER_ID,
    title: 'File GitHub issue: gateway --force crashes on Windows (lsof not found)',
    notes: 'Post at https://github.com/openclaw/openclaw/issues/new\n\nTitle: `gateway --force` crashes on Windows: "lsof not found"\n\nThe --force flag uses lsof to find/kill the port process. lsof is Linux/macOS only — does not exist on Windows.\n\nWorkaround: netstat -ano | findstr 41893 → find PID, then taskkill /PID <pid> /F\n\nSuggested fix: use fkill npm package or process.platform check.',
    status: 'todo',
    priority: 'high',
    assigned_by: 'agent',
    tags: ['openclaw', 'github', 'windows-bug']
  },
  {
    user_id: BILL_USER_ID,
    title: 'File GitHub issue: npm install leaves ghost process + Telegram bot token conflict on Windows',
    notes: 'Post at https://github.com/openclaw/openclaw/issues/new\n\nTitle: npm install leaves ghost node process holding bot token on Windows\n\nnpm install -g openclaw@latest does not stop the running gateway first. Old node process continues running, holds Telegram bot token → getUpdates conflict on restart.\n\nExtra: Task Scheduler spawned processes require elevated kill (Start-Process powershell -Verb RunAs -ArgumentList "taskkill /PID <pid> /F")\n\nFix: pre-install hook to detect/stop running gateway before replacing binaries.',
    status: 'todo',
    priority: 'high',
    assigned_by: 'agent',
    tags: ['openclaw', 'github', 'windows-bug']
  }
]

for (const task of tasks) {
  const { data, error } = await supabase.from('agent_tasks').insert(task).select()
  if (error) console.error('❌ Error:', error.message)
  else console.log('✅ Created:', data[0].id, '—', task.title)
}
