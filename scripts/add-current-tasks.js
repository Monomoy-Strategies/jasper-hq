const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const envContent = fs.readFileSync(__dirname + '/../.env.local', 'utf8')
const skMatch = envContent.match(/SUPABASE_SERVICE_KEY=(.+)/)
const SK = skMatch ? skMatch[1].trim() : ''
const supabase = createClient('https://cymfsifrjcisncnzywbd.supabase.co', SK)
const USER_ID = '1cfef549-ae52-4824-808b-7bfafb303adc'

async function run() {
  const tasks = [
    {
      title: 'TVE Issue #1 — Draft full newsletter for Tuesday send',
      status: 'in_progress',
      priority: 'high',
      notes: '5 Levels anchor piece + Monday Morning CEO Briefing prompt + 60-Second Lead Response spotlight',
      tags: ['vibe-entrepreneur', 'newsletter'],
    },
    {
      title: 'Set up Beehiiv account and embed on TVE site',
      status: 'todo',
      priority: 'high',
      notes: 'Need Bill to create Beehiiv account, then embed the subscribe form on thevibeentrepreneur.com',
      tags: ['vibe-entrepreneur', 'newsletter'],
    },
    {
      title: 'TVE Lead Magnet — Design free PDF/resource',
      status: 'todo',
      priority: 'medium',
      notes: 'Action 3 from launch sprint — free resource to drive subscribes',
      tags: ['vibe-entrepreneur', 'content'],
    },
    {
      title: 'TVE Named Content Formats — finalize recurring section names',
      status: 'in_progress',
      priority: 'medium',
      notes: 'Action 5 — The Vibe This Week, The Leverage Report, The Stack, Your Turn. Board approved.',
      tags: ['vibe-entrepreneur', 'content'],
    },
    {
      title: 'Jasper HQ — Context collector cron updates',
      status: 'in_progress',
      priority: 'medium',
      notes: 'Security collector needs to update security_status table more frequently with fresh context data',
      tags: ['jasper-hq', 'infrastructure'],
    },
    {
      title: 'HeartbeatGuard — YouTube video + newsletter launch',
      status: 'todo',
      priority: 'medium',
      notes: 'heartbeatguard.com ready, need to create launch content',
      tags: ['heartbeatguard', 'marketing'],
    },
  ]

  for (const task of tasks) {
    const { error } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: USER_ID,
        ...task,
        created_at: new Date().toISOString(),
      })
    if (error) {
      console.log(`ERROR: ${task.title}: ${error.message}`)
    } else {
      console.log(`✅ ${task.title}`)
    }
  }
}

run().catch(console.error)
