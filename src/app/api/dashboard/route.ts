import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const userId = process.env.USER_ID || process.env.NEXT_PUBLIC_USER_ID || ''

function getServerClient() {
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET() {
  const supabase = getServerClient()
  
  if (!supabase || !userId) {
    return NextResponse.json({
      error: 'Server not configured',
      _meta: { configured: false, hasUrl: !!supabaseUrl, hasKey: !!supabaseKey, hasUserId: !!userId }
    }, { status: 500 })
  }

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const weekEnd = new Date(now.getTime() + 7 * 86400000).toISOString()

    const [tasksRes, activitiesRes, docsRes, projectsRes, calendarTodayRes, calendarWeekRes, securityRes] = await Promise.all([
      supabase.from('agent_tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('agent_activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('agent_documents').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
      supabase.from('vault_projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('calendar_events').select('*').eq('user_id', userId).gte('start_time', todayStart).lt('start_time', todayEnd).order('start_time', { ascending: true }),
      supabase.from('calendar_events').select('*').eq('user_id', userId).gte('start_time', todayStart).lte('start_time', weekEnd).order('start_time', { ascending: true }).limit(20),
      supabase.from('security_status').select('data').eq('machine_id', 'monomoy-1').single(),
    ])

    const tasks = tasksRes.data || []
    const activities = activitiesRes.data || []
    const documents = docsRes.data || []
    const projects = projectsRes.data || []
    const calendarToday = calendarTodayRes.data || []
    const calendarWeek = calendarWeekRes.data || []
    const securityData = securityRes.data?.data || {}
    
    // Separate ideas from documents — ideas use metadata.status, not a direct column
    const ideas = documents.filter((d: any) => d.tags?.includes('idea') || d.category === 'planning')
      .map((d: any) => ({ ...d, status: d.metadata?.status || 'new' }))
    const docs = documents.filter((d: any) => !d.tags?.includes('idea') && d.category !== 'planning')

    // Extract context window usage from security collector data
    const contextUsage = securityData?.context ? {
      used: securityData.context.used || 0,
      total: securityData.context.total || 0,
    } : null

    // Find in-progress task, fallback to most recent task title
    const inProgressTask = tasks.find((t: any) => t.status === 'in_progress')
    const currentTaskTitle = inProgressTask?.title || 
      (tasks.length > 0 ? `${tasks.length} tasks in pipeline` : 'Idle')

    return NextResponse.json({
      status: {
        model: securityData?.system?.model || 'Claude Sonnet 4.6',
        channel: securityData?.system?.channel || 'discord',
        status: inProgressTask ? 'working' : 'idle',
        currentTask: currentTaskTitle,
        contextUsage,
      },
      tasks,
      activities,
      documents: docs,
      projects,
      calendar: { today: calendarToday, week: calendarWeek },
      ideas,
      _meta: {
        fetchedAt: new Date().toISOString(),
        counts: {
          tasks: tasks.length,
          activities: activities.length,
          documents: docs.length,
          projects: projects.length,
          calendarToday: calendarToday.length,
          calendarWeek: calendarWeek.length,
          ideas: ideas.length,
        }
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
