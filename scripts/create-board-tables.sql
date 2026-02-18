-- Board Sessions Table
-- Stores AI Board of Directors session records

CREATE TABLE IF NOT EXISTS board_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    topic TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    called_by TEXT,
    attendees JSONB DEFAULT '[]'::jsonb,
    markdown_content TEXT,
    key_insights JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    verdict TEXT,
    synthesis TEXT,
    file_path TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board Members (per-session member status)
CREATE TABLE IF NOT EXISTS board_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES board_sessions(id) ON DELETE CASCADE,
    seat TEXT NOT NULL,  -- CSO, COO, CRO, CPO
    name TEXT NOT NULL,  -- e.g., "Claude Opus 4.6"
    model TEXT NOT NULL, -- e.g., "opus"
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'thinking', 'researching', 'completed')),
    current_task TEXT,
    memo_content TEXT,
    theories JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_board_sessions_user_id ON board_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_board_sessions_status ON board_sessions(status);
CREATE INDEX IF NOT EXISTS idx_board_sessions_started_at ON board_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_members_session_id ON board_members(session_id);

-- Enable Row Level Security
ALTER TABLE board_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_sessions
CREATE POLICY "Users can view their own board sessions" ON board_sessions
    FOR SELECT USING (auth.uid() = user_id OR user_id = '1cfef549-ae52-4824-808b-7bfafb303adc'::uuid);

CREATE POLICY "Users can insert their own board sessions" ON board_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '1cfef549-ae52-4824-808b-7bfafb303adc'::uuid);

CREATE POLICY "Users can update their own board sessions" ON board_sessions
    FOR UPDATE USING (auth.uid() = user_id OR user_id = '1cfef549-ae52-4824-808b-7bfafb303adc'::uuid);

-- RLS Policies for board_members (access through session ownership)
CREATE POLICY "Users can view board members of their sessions" ON board_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM board_sessions 
            WHERE board_sessions.id = board_members.session_id 
            AND (auth.uid() = board_sessions.user_id OR board_sessions.user_id = '1cfef549-ae52-4824-808b-7bfafb303adc'::uuid)
        )
    );

CREATE POLICY "Users can insert board members for their sessions" ON board_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM board_sessions 
            WHERE board_sessions.id = board_members.session_id 
            AND (auth.uid() = board_sessions.user_id OR board_sessions.user_id = '1cfef549-ae52-4824-808b-7bfafb303adc'::uuid)
        )
    );

CREATE POLICY "Users can update board members of their sessions" ON board_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM board_sessions 
            WHERE board_sessions.id = board_members.session_id 
            AND (auth.uid() = board_sessions.user_id OR board_sessions.user_id = '1cfef549-ae52-4824-808b-7bfafb303adc'::uuid)
        )
    );

-- Service role bypass (for sync scripts)
CREATE POLICY "Service role full access sessions" ON board_sessions
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access members" ON board_members
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
