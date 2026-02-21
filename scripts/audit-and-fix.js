// Jasper HQ — Comprehensive Audit & Fix Script
// Run from jasper-hq directory: node scripts/audit-and-fix.js
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://cymfsifrjcisncnzywbd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5bWZzaWZyamNpc25jbnp5d2JkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyOTQ0MCwiZXhwIjoyMDg2ODg5NDQwfQ.Jz4gN784uO-SAd0_IIPLmYKlBSrs55ZAGszIvQ0JMdE'
const USER_ID = '1cfef549-ae52-4824-808b-7bfafb303adc'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function audit() {
  console.log('=== JASPER HQ DATABASE AUDIT ===\n')

  // Check tasks
  const { data: tasks, error: tasksErr } = await supabase
    .from('agent_tasks')
    .select('id, title, status, priority, created_at, project')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(30)

  if (tasksErr) {
    console.log('TASKS ERROR:', tasksErr.message)
  } else {
    console.log(`TASKS (${tasks.length} total):`)
    tasks.forEach(t => {
      console.log(`  [${t.status}] ${t.title} | ${t.project || 'no-project'} | ${t.created_at?.split('T')[0]}`)
    })
  }

  console.log()

  // Check ideas
  const { data: ideas, error: ideasErr } = await supabase
    .from('agent_documents')
    .select('id, title, status, tags, created_at')
    .eq('user_id', USER_ID)
    .contains('tags', ['idea'])
    .order('created_at', { ascending: false })
    .limit(30)

  if (ideasErr) {
    console.log('IDEAS ERROR:', ideasErr.message)
  } else {
    console.log(`IDEAS (${ideas.length} total):`)
    ideas.forEach(i => {
      console.log(`  [${i.status || 'new'}] ${i.title} | ${i.created_at?.split('T')[0]}`)
    })
  }

  console.log()

  // Check security_status
  const { data: security, error: secErr } = await supabase
    .from('security_status')
    .select('machine_id, updated_at, data')
    .eq('machine_id', 'monomoy-1')

  if (secErr) {
    console.log('SECURITY ERROR:', secErr.message)
  } else if (security?.[0]) {
    const d = security[0].data
    console.log(`SECURITY STATUS (last updated: ${security[0].updated_at}):`)
    console.log(`  OS: ${d?.system?.os}`)
    console.log(`  OpenClaw: ${d?.system?.openclawVersion}`)
    console.log(`  Context used: ${d?.context?.used} / ${d?.context?.total} (${d?.context?.discord?.pct}% discord)`)
    console.log(`  Current task: ${d?.system?.currentTask || 'none'}`)
  } else {
    console.log('SECURITY: No data found for monomoy-1')
  }

  console.log()

  // Check board sessions
  const { data: boardDocs, error: boardErr } = await supabase
    .from('agent_documents')
    .select('id, title, category, tags, created_at')
    .eq('user_id', USER_ID)
    .eq('category', 'ai-board')
    .order('created_at', { ascending: false })
    .limit(10)

  if (boardErr) {
    console.log('BOARD SESSIONS ERROR:', boardErr.message)
  } else {
    console.log(`BOARD SESSIONS (${boardDocs.length} total):`)
    boardDocs.forEach(b => {
      console.log(`  ${b.title} | ${b.created_at?.split('T')[0]} | tags: ${(b.tags || []).join(', ')}`)
    })
  }
}

audit().catch(console.error)
