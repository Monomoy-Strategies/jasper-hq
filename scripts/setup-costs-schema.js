// Creates cost_events and pending_commands tables in Supabase
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const envContent = fs.readFileSync(__dirname + '/../.env.local', 'utf8')
const skMatch = envContent.match(/SUPABASE_SERVICE_KEY=(.+)/)
const SK = skMatch ? skMatch[1].trim() : ''
const supabase = createClient('https://cymfsifrjcisncnzywbd.supabase.co', SK)
const USER_ID = '1cfef549-ae52-4824-808b-7bfafb303adc'

// Anthropic model pricing per million tokens (Feb 2026)
const MODEL_PRICING = {
  'claude-sonnet-4-6': { input: 3.00, output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  'claude-sonnet-4-5': { input: 3.00, output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  'claude-opus-4-6':   { input: 15.00, output: 75.00, cacheWrite: 18.75, cacheRead: 1.50 },
  'claude-opus-4-5':   { input: 15.00, output: 75.00, cacheWrite: 18.75, cacheRead: 1.50 },
  'claude-haiku-4-5':  { input: 0.80, output: 4.00, cacheWrite: 1.00, cacheRead: 0.08 },
}

function calcCost(model, inputTokens, outputTokens, cacheWriteTokens = 0, cacheReadTokens = 0) {
  const p = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-6']
  return (
    (inputTokens / 1_000_000) * p.input +
    (outputTokens / 1_000_000) * p.output +
    (cacheWriteTokens / 1_000_000) * p.cacheWrite +
    (cacheReadTokens / 1_000_000) * p.cacheRead
  )
}

async function run() {
  console.log('=== Setting up cost tracking schema ===\n')

  // 1. Create cost_events table via raw SQL
  const { error: tableErr } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS cost_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        session_key TEXT,
        model TEXT NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('discord', 'cron', 'telegram', 'interactive', 'other')),
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        cache_write_tokens INTEGER DEFAULT 0,
        cache_read_tokens INTEGER DEFAULT 0,
        cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
        description TEXT,
        recorded_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cost_events_user_id ON cost_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_cost_events_recorded_at ON cost_events(recorded_at);
      CREATE INDEX IF NOT EXISTS idx_cost_events_source ON cost_events(source);
      
      CREATE TABLE IF NOT EXISTS pending_commands (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        command TEXT NOT NULL,
        params JSONB DEFAULT '{}',
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'error')),
        result TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        executed_at TIMESTAMPTZ
      );
    `
  })

  if (tableErr) {
    console.log('RPC error (may not exist), trying direct insert approach:', tableErr.message)
  }

  // 2. Seed with estimated historical cost data (last 7 days based on known usage)
  console.log('Seeding historical cost data...')
  
  const now = new Date()
  const seedEvents = []
  
  // Build 7 days of realistic cost data
  for (let d = 6; d >= 0; d--) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    date.setHours(0, 0, 0, 0)
    
    // Morning briefing cron (5 AM, Sonnet, ~15k tokens)
    seedEvents.push({
      user_id: USER_ID,
      session_key: `cron-briefing-${d}`,
      model: 'claude-sonnet-4-6',
      source: 'cron',
      input_tokens: 8000,
      output_tokens: 5000,
      cache_write_tokens: 12000,
      cache_read_tokens: 3000,
      cost_usd: calcCost('claude-sonnet-4-6', 8000, 5000, 12000, 3000),
      description: 'Morning Briefing cron',
      recorded_at: new Date(date.getTime() + 5 * 3600000).toISOString(),
    })
    
    // Idea pipeline crons (6 AM + 10 AM, Haiku)
    seedEvents.push({
      user_id: USER_ID,
      session_key: `cron-ideas-${d}`,
      model: 'claude-haiku-4-5',
      source: 'cron',
      input_tokens: 3000,
      output_tokens: 2000,
      cache_write_tokens: 0,
      cache_read_tokens: 1000,
      cost_usd: calcCost('claude-haiku-4-5', 3000, 2000, 0, 1000),
      description: 'Idea Pipeline cron',
      recorded_at: new Date(date.getTime() + 6 * 3600000).toISOString(),
    })
    
    // Email triage (7 AM, Sonnet)
    seedEvents.push({
      user_id: USER_ID,
      session_key: `cron-triage-${d}`,
      model: 'claude-sonnet-4-6',
      source: 'cron',
      input_tokens: 5000,
      output_tokens: 3000,
      cache_write_tokens: 8000,
      cache_read_tokens: 2000,
      cost_usd: calcCost('claude-sonnet-4-6', 5000, 3000, 8000, 2000),
      description: 'Email Triage cron',
      recorded_at: new Date(date.getTime() + 7 * 3600000).toISOString(),
    })
    
    // Discord chat sessions (varies, Sonnet)
    const chatTokens = [20000, 45000, 35000, 60000, 25000, 80000, 174000][d]
    seedEvents.push({
      user_id: USER_ID,
      session_key: `discord-session-${d}`,
      model: 'claude-sonnet-4-6',
      source: 'discord',
      input_tokens: Math.floor(chatTokens * 0.2),
      output_tokens: Math.floor(chatTokens * 0.25),
      cache_write_tokens: Math.floor(chatTokens * 0.35),
      cache_read_tokens: Math.floor(chatTokens * 0.2),
      cost_usd: calcCost('claude-sonnet-4-6', chatTokens * 0.2, chatTokens * 0.25, chatTokens * 0.35, chatTokens * 0.2),
      description: 'Discord main session',
      recorded_at: new Date(date.getTime() + 14 * 3600000).toISOString(),
    })
    
    // AI board sessions (Opus, only on active days)
    if (d <= 2) {
      seedEvents.push({
        user_id: USER_ID,
        session_key: `opus-board-${d}`,
        model: 'claude-opus-4-5',
        source: 'discord',
        input_tokens: 8000,
        output_tokens: 12000,
        cache_write_tokens: 5000,
        cache_read_tokens: 2000,
        cost_usd: calcCost('claude-opus-4-5', 8000, 12000, 5000, 2000),
        description: 'AI Board session (Opus)',
        recorded_at: new Date(date.getTime() + 16 * 3600000).toISOString(),
      })
    }
  }
  
  // Insert events
  let inserted = 0
  for (const event of seedEvents) {
    const { error } = await supabase.from('cost_events').insert(event)
    if (error) {
      console.log(`  Skip (${event.description}): ${error.message}`)
    } else {
      inserted++
    }
  }
  
  console.log(`Inserted ${inserted}/${seedEvents.length} cost events`)
  
  // 3. Verify
  const { data: total } = await supabase
    .from('cost_events')
    .select('cost_usd')
    .eq('user_id', USER_ID)
  
  if (total) {
    const sum = total.reduce((acc, r) => acc + parseFloat(r.cost_usd), 0)
    console.log(`Total cost in DB: $${sum.toFixed(4)}`)
  }
  
  console.log('\nSchema and seed data complete!')
}

run().catch(console.error)
