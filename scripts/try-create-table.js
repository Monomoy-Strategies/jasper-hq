/**
 * Attempt to create ai_metrics via Supabase's internal SQL endpoint.
 * Supabase exposes a SQL execution endpoint at /rest/v1/rpc/... or
 * via the pg proxy at /pg for admin operations.
 */
const https = require('https')

const PROJECT_REF = 'cymfsifrjcisncnzywbd'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

const SQL = `
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
`

function post(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
    const req = https.request({
      hostname,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...headers },
    }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.write(bodyStr)
    req.end()
  })
}

async function main() {
  const endpoints = [
    // Supabase v1 Management API (needs PAT — will fail with service key)
    { host: 'api.supabase.com', path: `/v1/projects/${PROJECT_REF}/database/query`, body: { query: SQL } },
    // Supabase pg proxy (v2)
    { host: `${PROJECT_REF}.supabase.co`, path: '/pg', body: { query: SQL } },
  ]

  for (const ep of endpoints) {
    console.log(`\nTrying: https://${ep.host}${ep.path}`)
    try {
      const res = await post(ep.host, ep.path, {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      }, ep.body)
      console.log('Status:', res.status)
      console.log('Body:', JSON.stringify(res.body).slice(0, 300))
    } catch (e) {
      console.log('Error:', e.message)
    }
  }
}

main()
