#!/usr/bin/env node
/**
 * Create board_sessions and board_members tables in Supabase
 * Uses the REST API to run DDL statements
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cymfsifrjcisncnzywbd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTableExists(tableName) {
    const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
    
    // If we get a 404 or relation doesn't exist error, table doesn't exist
    if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        return false;
    }
    return true;
}

async function main() {
    console.log('Checking for board_sessions table...');
    
    const sessionsExist = await checkTableExists('board_sessions');
    console.log(`board_sessions exists: ${sessionsExist}`);
    
    const membersExist = await checkTableExists('board_members');
    console.log(`board_members exists: ${membersExist}`);
    
    if (!sessionsExist || !membersExist) {
        console.log('\n===============================================');
        console.log('MANUAL SETUP REQUIRED');
        console.log('===============================================');
        console.log('\nPlease run the following SQL in Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/cymfsifrjcisncnzywbd/sql/new\n');
        console.log('-- Copy everything from scripts/create-board-tables.sql');
        console.log('===============================================\n');
        process.exit(1);
    }
    
    console.log('\nTables exist! Running test insert...');
    
    // Test insert
    const testSession = {
        user_id: '1cfef549-ae52-4824-808b-7bfafb303adc',
        title: 'Test Session',
        topic: 'Testing table setup',
        status: 'completed',
        called_by: 'Setup Script',
        attendees: [],
        markdown_content: '# Test',
        key_insights: ['Tables are working'],
        action_items: [],
        file_path: '__test__',
    };
    
    const { data, error } = await supabase
        .from('board_sessions')
        .insert(testSession)
        .select('id')
        .single();
    
    if (error) {
        console.error('Insert error:', error);
        process.exit(1);
    }
    
    console.log('Test insert successful! ID:', data.id);
    
    // Clean up test
    await supabase.from('board_sessions').delete().eq('id', data.id);
    console.log('Cleaned up test record.');
    console.log('\nSetup complete! Tables are ready.');
}

main().catch(console.error);
