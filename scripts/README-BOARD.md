# AI Board of Directors - Jasper HQ Integration

Real-time visibility into AI Board sessions from the Jasper HQ dashboard.

## Overview

When Jasper convenes a board meeting (spawning sub-agents as COO/Codex, CRO/Grok, CPO/Gemini), the sessions are synced to Supabase and displayed in the AI Board tab.

## Features

- **Active Sessions** - See which board members are currently working
- **Live Status** - Track member status: thinking, researching, completed
- **Member Memos** - View each member's theories and recommendations
- **Action Items** - Track session action items with completion status
- **Key Insights** - CSO synthesis and priority recommendations
- **Past Sessions** - Browse historical board meetings

## Scripts

### Sync Board Sessions
Syncs BOARD-SESSION-*.md files from `clawd/projects/` to Supabase:

```bash
# Sync all sessions
node scripts/sync-board-sessions.js

# Sync single file
node scripts/sync-board-sessions.js --file "C:\path\to\BOARD-SESSION-2026-02-18.md"
```

### Update Member Status (Live Sessions)
Update a board member's status during an active session:

```bash
# Usage: node update-board-member-status.js <session_id> <seat> <status> [current_task]

# Examples:
node scripts/update-board-member-status.js fed980b6-9fd8-4449-ba34-467a391f5be4 COO thinking "Analyzing code flow"
node scripts/update-board-member-status.js fed980b6-9fd8-4449-ba34-467a391f5be4 CRO researching "Checking GitHub issues"
node scripts/update-board-member-status.js fed980b6-9fd8-4449-ba34-467a391f5be4 CPO completed
```

**Status values:** `waiting`, `thinking`, `researching`, `completed`
**Seat values:** `CSO`, `COO`, `CRO`, `CPO`

## Data Storage

Board sessions are stored in the `agent_documents` table with:
- `category = 'ai-board'`
- `tags` includes `'board-session'`
- `content` is a JSON string with the parsed session data

### Content Schema

```typescript
interface BoardSessionContent {
  topic: string
  status: 'active' | 'in_progress' | 'completed' | 'cancelled'
  called_by: string | null
  attendees: { seat: string; name: string }[]
  members: {
    seat: string
    name: string
    focus?: string
    status: 'waiting' | 'thinking' | 'researching' | 'completed' | 'ruled_out' | 'possible'
    theories: string[]
    recommendations: string[]
  }[]
  key_insights: string[]
  action_items: { text: string; completed: boolean }[]
  synthesis: string | null
  date: string | null
  file_path: string
}
```

## Board Session Markdown Format

Sessions are stored as markdown files at `clawd/projects/BOARD-SESSION-*.md`:

```markdown
# 🏛️ AI Board of Directors — Session Title
## Topic

**Date:** February 18, 2026
**Called by:** CSO (Jasper Monomoy)
**Attendees:** COO (GPT-5.2 Codex), CRO (Grok 3), CPO (Gemini 3 Pro)

---

### COO (Codex) — Operations & Execution
- **Theory:** [theory text]
- **Status:** ❌ RULED OUT — [reason]
- **Recommendation:** [recommendation text]

### CRO (Grok) — Research & Contrarian
- **Theory 1:** [theory text]
- **Status:** ⚠️ POSSIBLE
- **Recommendation:** [recommendation text]

### CPO (Gemini) — Product & Architecture
- **Theory:** [theory text]
- **Status:** ⚠️ PLAUSIBLE
- **Recommendation:** [recommendation text]

---

## CSO Synthesis — Unified Recommendations

### 🔴 Priority 1: [title]
[description]

### 🟡 Priority 2: [title]
[description]

---

## Action Items
1. [ ] Action item 1
2. [ ] Action item 2
3. [x] Completed action item
```

## Integration with Jasper

When convening a board meeting, Jasper should:

1. Create a new markdown file: `BOARD-SESSION-YYYY-MM-DD-TOPIC.md`
2. Run the sync script after each update: `node scripts/sync-board-sessions.js --file <path>`
3. Optionally update member status in real-time during the meeting

## Future Enhancements

- [ ] WebSocket real-time updates (currently polling every 60s)
- [ ] Dedicated `board_sessions` and `board_members` tables
- [ ] Auto-sync via file watcher
- [ ] Board meeting scheduler
- [ ] Email/Discord notifications for session completion
