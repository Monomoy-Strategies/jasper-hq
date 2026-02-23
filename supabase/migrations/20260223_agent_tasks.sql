-- Agent Tasks table for the Agent Command Center
-- Stores tasks for all 5 Monomoy agents: beacon, navigator, rigger, dev (forge), fort (anchor)

create table if not exists agent_tasks (
  id text primary key,
  agent text not null,
  project text,
  title text not null,
  description text,
  branch text,
  pr integer,
  status text not null default 'queued',
  priority text not null default 'P2',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz,
  notes text
);

-- Enable RLS
alter table agent_tasks enable row level security;

-- Allow service role full access
create policy "service role full access" on agent_tasks
  for all using (true);

-- Allow anon/authenticated read
create policy "anyone can read agent_tasks" on agent_tasks
  for select using (true);

-- Enable realtime
alter publication supabase_realtime add table agent_tasks;
