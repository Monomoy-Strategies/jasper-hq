/**
 * create-ai-metrics-table.js
 * Creates the ai_metrics table directly via Supabase REST API.
 */

const https = require('https')

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cymfsifrjcisncnzywbd.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS public.ai_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name text NOT NULL,
  metric_date date NOT NULL,
  api_calls integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10, 4) NOT NULL DEFAULT 0,
  estimated_minutes_saved numeric(10, 2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_metrics_tool_date_unique UNIQUE(tool_name, metric_date)
);

CREATE INDEX IF NOT EXISTS ai_metrics_date_idx ON public.ai_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS ai_metrics_tool_idx ON public.ai_metrics(tool_name);

ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role full access" ON public.ai_metrics
  FOR ALL USING (true) WITH CHECK (true);
`

function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

async function main() {
  // Try via the /rest/v1/rpc endpoint with a create function call
  // Actually, try via the pg REST endpoint
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
  
  console.log('Project ref:', projectRef)
  console.log('Attempting to create table via Supabase Management API...')
  
  const body = JSON.stringify({ query: CREATE_SQL })
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Length': Buffer.byteLength(body),
    }
  }

  // Try the database query endpoint
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`
  console.log('Trying:', url)
  
  try {
    const res = await request(url, options, body)
    console.log('Status:', res.status)
    console.log('Body:', JSON.stringify(res.body, null, 2))
  } catch (err) {
    console.error('Error:', err.message)
  }
}

main()
