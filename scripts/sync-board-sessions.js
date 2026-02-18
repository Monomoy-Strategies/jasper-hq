#!/usr/bin/env node
/**
 * Sync Board Session Markdown Files to Supabase
 * 
 * Uses agent_documents table with doc_type='board_session' and category='ai-board'
 * This allows the feature to work immediately without creating new tables.
 * 
 * Usage: 
 *   node scripts/sync-board-sessions.js              # Sync all sessions
 *   node scripts/sync-board-sessions.js --file <path> # Sync single file
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cymfsifrjcisncnzywbd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5bWZzaWZyamNpc25jbnp5d2JkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ1Mzk1NiwiZXhwIjoyMDc2MDI5OTU2fQ.wPTBKN81-E-xWVyg5Y7aNSj8RMsojaXvTHs54qmwpeE';
const USER_ID = process.env.USER_ID || '1cfef549-ae52-4824-808b-7bfafb303adc';
const BOARD_SESSIONS_DIR = process.env.BOARD_SESSIONS_DIR || path.join(__dirname, '../../projects');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Parse a board session markdown file
 */
function parseSessionMarkdown(content, filePath) {
    const session = {
        title: '',
        topic: '',
        status: 'completed',
        called_by: null,
        attendees: [],
        key_insights: [],
        action_items: [],
        verdict: null,
        synthesis: null,
        file_path: filePath,
        date: null,
        members: [],
    };

    // Extract title from first H1
    const titleMatch = content.match(/^#\s+(.+?)[\r\n]/m);
    if (titleMatch) {
        // Remove emoji prefix if present
        session.title = titleMatch[1].replace(/^[^\w]*/, '').trim();
    }

    // Extract topic from ## subtitle (usually line 2)
    const topicMatch = content.match(/^##\s+(.+?)[\r\n]/m);
    if (topicMatch) {
        session.topic = topicMatch[1].trim();
    }

    // Extract date
    const dateMatch = content.match(/\*\*Date:\*\*\s*(.+?)[\r\n]/i);
    if (dateMatch) {
        const dateStr = dateMatch[1].trim();
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            session.date = parsed.toISOString().split('T')[0];
        }
    }

    // Try to extract date from filename if not found
    if (!session.date) {
        const filenameDateMatch = path.basename(filePath).match(/(\d{4}-\d{2}-\d{2})/);
        if (filenameDateMatch) {
            session.date = filenameDateMatch[1];
        }
    }

    // Extract "Called by"
    const calledByMatch = content.match(/\*\*Called by:\*\*\s*(.+?)[\r\n]/i);
    if (calledByMatch) {
        session.called_by = calledByMatch[1].trim();
    }

    // Extract attendees
    const attendeesMatch = content.match(/\*\*Attendees:\*\*\s*(.+?)[\r\n]/i);
    if (attendeesMatch) {
        const attendeesStr = attendeesMatch[1].trim();
        const memberRegex = /(\w+)\s*\(([^)]+)\)/g;
        let match;
        while ((match = memberRegex.exec(attendeesStr)) !== null) {
            session.attendees.push({
                seat: match[1],
                name: match[2],
            });
        }
    }

    // Extract board member memos
    const memoSectionRegex = /###\s+(\w+)\s*\(([^)]+)\)\s*[-—]\s*([^\n]+)/g;
    let memoMatch;
    while ((memoMatch = memoSectionRegex.exec(content)) !== null) {
        const seat = memoMatch[1];
        const name = memoMatch[2];
        const focus = memoMatch[3];
        
        // Find the content between this header and the next ### or ##
        const startIdx = content.indexOf(memoMatch[0]) + memoMatch[0].length;
        let endIdx = content.length;
        
        const nextSection = content.substring(startIdx).match(/\n###?\s/);
        if (nextSection) {
            endIdx = startIdx + nextSection.index;
        }
        
        const memoContent = content.substring(startIdx, endIdx).trim();
        
        // Extract theories
        const theories = [];
        const theoryMatches = memoContent.match(/\*\*Theory[^:]*:\*\*\s*([^\n]+)/gi) || [];
        theoryMatches.forEach(t => {
            const text = t.replace(/\*\*Theory[^:]*:\*\*/i, '').trim();
            if (text) theories.push(text);
        });

        // Extract recommendations
        const recommendations = [];
        const recMatches = memoContent.match(/\*\*Recommendation:\*\*\s*([^\n]+)/gi) || [];
        recMatches.forEach(r => {
            const text = r.replace(/\*\*Recommendation:\*\*/i, '').trim();
            if (text) recommendations.push(text);
        });

        // Extract status
        let status = 'completed';
        const statusMatch = memoContent.match(/\*\*Status:\*\*\s*([^\n]+)/i);
        if (statusMatch) {
            const statusText = statusMatch[1].toLowerCase();
            if (statusText.includes('ruled out')) status = 'ruled_out';
            else if (statusText.includes('possible') || statusText.includes('plausible')) status = 'possible';
        }

        session.members.push({
            seat,
            name,
            focus,
            status,
            theories,
            recommendations,
        });
    }

    // Extract action items
    const actionItemsSection = content.match(/##\s*Action Items[\r\n]+([\s\S]*?)(?=##|$)/i);
    if (actionItemsSection) {
        const items = actionItemsSection[1].match(/\d+\.\s*\[(.)\]\s*(.+)/g) || [];
        session.action_items = items.map(item => {
            const checkMatch = item.match(/\[(.)\]/);
            const completed = checkMatch && (checkMatch[1] === 'x' || checkMatch[1] === 'X');
            const text = item.replace(/^\d+\.\s*\[.\]\s*/, '').trim();
            return { text, completed };
        });
    }

    // Extract key insights from CSO Synthesis
    const synthesisMatch = content.match(/##\s*CSO Synthesis[^#]*([\s\S]*?)(?=##\s*Action|$)/i);
    if (synthesisMatch) {
        session.synthesis = synthesisMatch[1].trim().substring(0, 3000);
        
        // Extract priority items as key insights
        const priorities = synthesisMatch[1].match(/###\s*[^#]+/g) || [];
        priorities.forEach(p => {
            const lines = p.split('\n').filter(l => l.trim());
            if (lines.length > 0) {
                const insight = lines[0].replace(/^###\s*/, '').trim();
                if (insight) session.key_insights.push(insight);
            }
        });
    }

    // Determine overall status
    if (session.action_items.length > 0 && session.action_items.every(a => a.completed)) {
        session.status = 'completed';
    } else if (session.action_items.some(a => !a.completed)) {
        session.status = 'in_progress';
    }

    return session;
}

/**
 * Sync a single session file to Supabase (using agent_documents table)
 */
async function syncSessionFile(filePath) {
    console.log(`Syncing: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const session = parseSessionMarkdown(content, filePath);
    
    // Store as agent_document with special structure
    const docData = {
        user_id: USER_ID,
        title: session.title || path.basename(filePath, '.md'),
        content: JSON.stringify({
            topic: session.topic,
            status: session.status,
            called_by: session.called_by,
            attendees: session.attendees,
            members: session.members,
            key_insights: session.key_insights,
            action_items: session.action_items,
            synthesis: session.synthesis,
            date: session.date,
            file_path: session.file_path,
        }),
        doc_type: 'briefing',  // Using existing type
        category: 'ai-board',
        is_pinned: false,
        is_archived: false,
        tags: ['board-session', 'ai-council'],
        metadata: {
            session_date: session.date,
            status: session.status,
            member_count: session.members.length,
            action_items_count: session.action_items.length,
            word_count: content.split(/\s+/).length,
        },
    };

    // Check if session already exists by file_path in content
    const { data: existing } = await supabase
        .from('agent_documents')
        .select('id, content')
        .eq('user_id', USER_ID)
        .eq('category', 'ai-board')
        .ilike('content', `%"file_path":"${filePath.replace(/\\/g, '\\\\')}"%`)
        .single();
    
    let docId;
    
    if (existing) {
        // Update existing
        const { data, error } = await supabase
            .from('agent_documents')
            .update({
                ...docData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select('id')
            .single();
        
        if (error) throw error;
        docId = data.id;
        console.log(`  Updated: ${docId}`);
    } else {
        // Insert new
        const { data, error } = await supabase
            .from('agent_documents')
            .insert(docData)
            .select('id')
            .single();
        
        if (error) throw error;
        docId = data.id;
        console.log(`  Created: ${docId}`);
    }
    
    console.log(`  Title: ${session.title}`);
    console.log(`  Date: ${session.date}`);
    console.log(`  Members: ${session.members.length}`);
    console.log(`  Action Items: ${session.action_items.length}`);
    
    return docId;
}

/**
 * Main sync function
 */
async function main() {
    const args = process.argv.slice(2);
    
    // Check for --file argument
    const fileIdx = args.indexOf('--file');
    if (fileIdx !== -1 && args[fileIdx + 1]) {
        const filePath = args[fileIdx + 1];
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
        }
        await syncSessionFile(filePath);
        console.log('\nDone!');
        return;
    }
    
    // Sync all BOARD-SESSION-*.md files
    if (!fs.existsSync(BOARD_SESSIONS_DIR)) {
        console.error(`Directory not found: ${BOARD_SESSIONS_DIR}`);
        process.exit(1);
    }
    
    const files = fs.readdirSync(BOARD_SESSIONS_DIR)
        .filter(f => f.startsWith('BOARD-SESSION-') && f.endsWith('.md'))
        .map(f => path.join(BOARD_SESSIONS_DIR, f));
    
    console.log(`Found ${files.length} board session files\n`);
    
    let synced = 0;
    for (const file of files) {
        try {
            await syncSessionFile(file);
            synced++;
            console.log('');
        } catch (err) {
            console.error(`Error syncing ${file}:`, err.message);
        }
    }
    
    console.log(`\nSync complete! ${synced}/${files.length} sessions synced.`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
