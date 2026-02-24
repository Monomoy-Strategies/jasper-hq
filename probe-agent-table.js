const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const id = crypto.randomUUID();
  
  // Try inserting with uuid and NO agent column — see what columns exist
  const { data, error } = await sb.from('agent_tasks').insert({ id, title: 'probe', status: 'queued', priority: 'P2' }).select();
  console.log('error:', JSON.stringify(error));
  if (data && data[0]) {
    console.log('columns:', Object.keys(data[0]));
    console.log('sample:', JSON.stringify(data[0], null, 2));
    await sb.from('agent_tasks').delete().eq('id', id);
  }
}
run().catch(e => console.error(e.message));
