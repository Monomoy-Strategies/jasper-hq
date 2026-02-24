const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Try inserting with minimal required fields (no agent column)
  const { data: d1, error: e1 } = await sb.from('agent_tasks').insert({
    id: 'test-col-check',
    title: 'test',
    status: 'queued',
    priority: 'P2',
  }).select();
  console.log('insert no-agent error:', JSON.stringify(e1));
  console.log('insert no-agent data:', JSON.stringify(d1));
  
  // Try with agent column
  const { data: d2, error: e2 } = await sb.from('agent_tasks').insert({
    id: 'test-col-check-2',
    agent: 'beacon',
    title: 'test',
    status: 'queued',
    priority: 'P2',
  }).select();
  console.log('insert with-agent error:', JSON.stringify(e2));
  console.log('insert with-agent data keys:', d2 ? Object.keys(d2[0] || {}) : 'null');

  // Cleanup
  await sb.from('agent_tasks').delete().in('id', ['test-col-check', 'test-col-check-2']);
}
run().catch(e => console.error(e.message));
