const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://cymfsifrjcisncnzywbd.supabase.co', process.env.SB_KEY);
async function respond() {
  await sb.from('jasper_chat').insert({
    role: 'assistant',
    content: process.env.RESPONSE_TEXT,
    status: 'complete',
    session_id: 'main'
  });
  console.log('RESPONDED');
}
respond().catch(e => console.error(e));
