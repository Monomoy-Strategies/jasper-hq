#!/usr/bin/env node
/**
 * Update a board member's status during an active session
 * 
 * Usage:
 *   node scripts/update-board-member-status.js <session_id> <seat> <status> [current_task]
 *   
 * Example:
 *   node scripts/update-board-member-status.js fed980b6-9fd8-4449-ba34-467a391f5be4 COO thinking "Analyzing code flow"
 *   
 * Status values: waiting, thinking, researching, completed
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cymfsifrjcisncnzywbd.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5bWZzaWZyamNpc25jbnp5d2JkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ1Mzk1NiwiZXhwIjoyMDc2MDI5OTU2fQ.wPTBKN81-E-xWVyg5Y7aNSj8RMsojaXvTHs54qmwpeE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateMemberStatus(sessionId, seat, status, currentTask) {
    // Fetch the session
    const { data: session, error: fetchError } = await supabase
        .from('agent_documents')
        .select('*')
        .eq('id', sessionId)
        .single();
    
    if (fetchError || !session) {
        console.error('Session not found:', fetchError?.message || 'No data');
        process.exit(1);
    }
    
    // Parse content
    let content;
    try {
        content = JSON.parse(session.content);
    } catch {
        console.error('Invalid session content format');
        process.exit(1);
    }
    
    // Find and update member
    const memberIdx = content.members?.findIndex(m => m.seat === seat);
    if (memberIdx === -1 || memberIdx === undefined) {
        console.error(`Member ${seat} not found in session`);
        process.exit(1);
    }
    
    content.members[memberIdx].status = status;
    if (currentTask) {
        content.members[memberIdx].current_task = currentTask;
    }
    
    // Update session status if needed
    if (status === 'thinking' || status === 'researching') {
        content.status = 'active';
    }
    
    // Check if all members completed
    const allCompleted = content.members.every(m => 
        m.status === 'completed' || m.status === 'ruled_out'
    );
    if (allCompleted) {
        content.status = 'completed';
    }
    
    // Save back
    const { error: updateError } = await supabase
        .from('agent_documents')
        .update({
            content: JSON.stringify(content),
            metadata: {
                ...session.metadata,
                status: content.status,
            },
            updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    
    if (updateError) {
        console.error('Update failed:', updateError.message);
        process.exit(1);
    }
    
    console.log(`Updated ${seat} status to: ${status}`);
    if (currentTask) {
        console.log(`Current task: ${currentTask}`);
    }
    console.log(`Session status: ${content.status}`);
}

// Parse CLI args
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log('Usage: node update-board-member-status.js <session_id> <seat> <status> [current_task]');
    console.log('');
    console.log('Status values: waiting, thinking, researching, completed');
    console.log('Seat values: CSO, COO, CRO, CPO');
    process.exit(1);
}

const [sessionId, seat, status, ...taskParts] = args;
const currentTask = taskParts.join(' ') || null;

updateMemberStatus(sessionId, seat.toUpperCase(), status, currentTask).catch(console.error);
