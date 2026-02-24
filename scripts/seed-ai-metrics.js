/**
 * seed-ai-metrics.js
 * Creates and seeds the ai_metrics table in Supabase with realistic mock data.
 *
 * AIDEN INTEGRATION NOTE:
 * This data module is designed to be consumed by AIDEN (AI Executive Navigator)
 * as a core reporting feature. When AIDEN is built, connect it to the ai_metrics
 * table for real-time ROI tracking, spend alerts, and executive dashboards.
 * The schema is intentionally generic to support future real API-call logging.
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Realistic cost/usage profiles for Bill's actual AI tool stack
const toolProfiles = {
  'Anthropic/Claude': {
    baseCost: 38,       // ~$38/day average (heavy usage via OpenClaw)
    baseAPICalls: 145,  // API calls per day
    baseSaved: 220,     // minutes saved per day
    variance: 0.3,
  },
  'OpenAI': {
    baseCost: 12,
    baseAPICalls: 48,
    baseSaved: 65,
    variance: 0.4,
  },
  'xAI/Grok': {
    baseCost: 8,
    baseAPICalls: 22,
    baseSaved: 40,
    variance: 0.5,
  },
  'ElevenLabs TTS': {
    baseCost: 4,
    baseAPICalls: 35,
    baseSaved: 18,
    variance: 0.35,
  },
  'Firecrawl': {
    baseCost: 6,
    baseAPICalls: 18,
    baseSaved: 55,
    variance: 0.6,
  },
  'OpenClaw': {
    baseCost: 29,        // subscription flat rate
    baseAPICalls: 200,   // orchestration calls
    baseSaved: 180,      // massive time savings as the orchestration layer
    variance: 0.15,
  },
}

function randVariance(base, variance) {
  const factor = 1 + (Math.random() - 0.5) * 2 * variance
  return Math.max(0, base * factor)
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

async function createTable() {
  console.log('Creating ai_metrics table via RPC...')

  // Use raw SQL via rpc to create the table if it doesn't exist
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ai_metrics (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        tool_name text NOT NULL,
        metric_date date NOT NULL,
        api_calls integer NOT NULL DEFAULT 0,
        estimated_cost_usd numeric(10, 4) NOT NULL DEFAULT 0,
        estimated_minutes_saved numeric(10, 2) NOT NULL DEFAULT 0,
        notes text,
        created_at timestamp with time zone DEFAULT now(),
        UNIQUE(tool_name, metric_date)
      );
      CREATE INDEX IF NOT EXISTS ai_metrics_date_idx ON ai_metrics(metric_date DESC);
      CREATE INDEX IF NOT EXISTS ai_metrics_tool_idx ON ai_metrics(tool_name);
    `
  })

  if (error) {
    console.log('RPC not available, will try direct insert (table may already exist):', error.message)
  } else {
    console.log('Table created/verified via RPC.')
  }
}

async function seedData() {
  const rows = []
  const now = new Date()

  // Generate 35 days of data (gives us this month + last month overlap)
  for (let daysAgo = 34; daysAgo >= 0; daysAgo--) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    const dateStr = date.toISOString().split('T')[0]
    const weekend = isWeekend(date)
    const weekendMultiplier = weekend ? 0.4 : 1.0

    for (const [toolName, profile] of Object.entries(toolProfiles)) {
      const apiCalls = Math.round(randVariance(profile.baseAPICalls, profile.variance) * weekendMultiplier)
      let costUsd = randVariance(profile.baseCost, profile.variance) * weekendMultiplier
      
      // OpenClaw is a flat subscription — consistent cost regardless of day
      if (toolName === 'OpenClaw') {
        costUsd = profile.baseCost / 30 // daily portion of monthly sub
      }

      const minutesSaved = randVariance(profile.baseSaved, profile.variance) * weekendMultiplier

      rows.push({
        tool_name: toolName,
        metric_date: dateStr,
        api_calls: apiCalls,
        estimated_cost_usd: parseFloat(costUsd.toFixed(4)),
        estimated_minutes_saved: parseFloat(minutesSaved.toFixed(2)),
        notes: weekend ? 'Weekend — reduced usage' : null,
      })
    }
  }

  console.log(`Seeding ${rows.length} rows...`)

  // Upsert in batches
  const batchSize = 50
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase
      .from('ai_metrics')
      .upsert(batch, { onConflict: 'tool_name,metric_date' })

    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error.message)
    } else {
      console.log(`Batch ${i / batchSize + 1} seeded (${batch.length} rows)`)
    }
  }

  console.log('Seed complete!')
}

async function verify() {
  const { data, error } = await supabase
    .from('ai_metrics')
    .select('tool_name, metric_date, api_calls, estimated_cost_usd, estimated_minutes_saved')
    .order('metric_date', { ascending: false })
    .limit(6)

  if (error) {
    console.error('Verify error:', error.message)
    return
  }

  console.log('\nSample rows:')
  console.table(data)
  console.log(`\nTotal rows visible: check Supabase dashboard`)
}

async function main() {
  await createTable()
  await seedData()
  await verify()
}

main().catch(console.error)
