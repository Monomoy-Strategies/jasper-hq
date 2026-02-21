// Seed cost events using agent_documents table (category: 'cost-event')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const envContent = fs.readFileSync(__dirname + '/../.env.local', 'utf8')
const SK = envContent.match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim()
const supabase = createClient('https://cymfsifrjcisncnzywbd.supabase.co', SK)
const USER_ID = '1cfef549-ae52-4824-808b-7bfafb303adc'

// Anthropic pricing per million tokens
const PRICING = {
  'claude-sonnet-4-6': { input: 3.00, output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  'claude-opus-4-5':   { input: 15.00, output: 75.00, cacheWrite: 18.75, cacheRead: 1.50 },
  'claude-haiku-4-5':  { input: 0.80, output: 4.00, cacheWrite: 1.00, cacheRead: 0.08 },
}

function cost(model, inp, out, cw=0, cr=0) {
  const p = PRICING[model] || PRICING['claude-sonnet-4-6']
  return +(((inp/1e6)*p.input + (out/1e6)*p.output + (cw/1e6)*p.cacheWrite + (cr/1e6)*p.cacheRead)).toFixed(6)
}

async function run() {
  const now = new Date()
  const events = []

  for (let d = 6; d >= 0; d--) {
    const base = new Date(now)
    base.setDate(base.getDate() - d)
    base.setHours(0, 0, 0, 0)

    const t = (h) => new Date(base.getTime() + h * 3600000).toISOString()

    // Morning briefing (5AM, Sonnet)
    events.push({ ts: t(5), model: 'claude-sonnet-4-6', source: 'cron', desc: 'Morning Briefing', inp: 8000, out: 5000, cw: 12000, cr: 3000 })
    // Idea pipeline (6AM, Haiku)
    events.push({ ts: t(6), model: 'claude-haiku-4-5', source: 'cron', desc: 'Idea Pipeline', inp: 3000, out: 2000, cw: 0, cr: 1000 })
    // Email triage (7AM, Sonnet)
    events.push({ ts: t(7), model: 'claude-sonnet-4-6', source: 'cron', desc: 'Email Triage AM', inp: 5000, out: 3000, cw: 8000, cr: 2000 })
    // Intel briefing (8:30AM, Haiku)
    events.push({ ts: t(8.5), model: 'claude-haiku-4-5', source: 'cron', desc: 'Intel Briefing', inp: 4000, out: 2500, cw: 0, cr: 1500 })
    // Idea review (10AM, Haiku)
    events.push({ ts: t(10), model: 'claude-haiku-4-5', source: 'cron', desc: 'Idea Review', inp: 2500, out: 1800, cw: 0, cr: 800 })
    // Email triage noon (Sonnet)
    events.push({ ts: t(12), model: 'claude-sonnet-4-6', source: 'cron', desc: 'Email Triage Noon', inp: 4000, out: 2500, cw: 6000, cr: 1800 })

    // Discord sessions (varies by day)
    const chatSizes = [20000, 45000, 35000, 60000, 25000, 80000, 174000]
    const ctoks = chatSizes[d]
    events.push({ ts: t(14), model: 'claude-sonnet-4-6', source: 'discord', desc: 'Discord main session', inp: Math.floor(ctoks*0.2), out: Math.floor(ctoks*0.25), cw: Math.floor(ctoks*0.35), cr: Math.floor(ctoks*0.2) })

    // AI Board sessions (Opus) - last 3 days
    if (d <= 2) {
      events.push({ ts: t(16), model: 'claude-opus-4-5', source: 'discord', desc: 'AI Board (Opus)', inp: 8000, out: 12000, cw: 5000, cr: 2000 })
    }

    // Email triage 5PM
    events.push({ ts: t(17), model: 'claude-sonnet-4-6', source: 'cron', desc: 'Email Triage PM', inp: 3500, out: 2000, cw: 5000, cr: 1500 })
  }

  console.log(`Seeding ${events.length} cost events...`)
  let ok = 0
  for (const e of events) {
    const { error } = await supabase.from('agent_documents').insert({
      user_id: USER_ID,
      title: `Cost: ${e.desc}`,
      category: 'cost-event',
      tags: ['cost', e.source, e.model],
      content: e.desc,
      metadata: {
        model: e.model,
        source: e.source,
        description: e.desc,
        input_tokens: e.inp,
        output_tokens: e.out,
        cache_write_tokens: e.cw,
        cache_read_tokens: e.cr,
        cost_usd: cost(e.model, e.inp, e.out, e.cw, e.cr),
        recorded_at: e.ts,
      },
      created_at: e.ts,
    })
    if (error) console.log(`  ERR ${e.desc}: ${error.message}`)
    else { ok++; process.stdout.write('.') }
  }

  console.log(`\nDone: ${ok}/${events.length} inserted`)

  // Show totals
  const { data } = await supabase.from('agent_documents').select('metadata').eq('user_id', USER_ID).eq('category', 'cost-event')
  if (data) {
    const total = data.reduce((s, r) => s + (r.metadata?.cost_usd || 0), 0)
    console.log(`Total seeded cost: $${total.toFixed(4)}`)
    
    const byModel = {}
    data.forEach(r => {
      const m = r.metadata?.model || 'unknown'
      byModel[m] = (byModel[m] || 0) + (r.metadata?.cost_usd || 0)
    })
    console.log('By model:', JSON.stringify(Object.fromEntries(Object.entries(byModel).map(([k,v]) => [k, '$'+v.toFixed(4)]))))
  }
}
run().catch(console.error)
