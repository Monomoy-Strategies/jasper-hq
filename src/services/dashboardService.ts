import { supabase, USER_ID } from '@/lib/supabase'
import type { 
  AgentActivity, 
  AgentTask, 
  CalendarEventSummary, 
  AgentNotification,
  DashboardStats,
  AgentDocument,
  AgentProject,
  AgentDeliverable,
  AgentScheduledWorkflow,
  AgentNote,
  SystemHealth
} from '@/types'

// =====================================================
// Calendar Services
// =====================================================

export async function getUpcomingEvents(limit = 10): Promise<CalendarEventSummary[]> {
  const now = new Date().toISOString()
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, title, start_time, end_time, location, is_all_day')
    .eq('user_id', USER_ID)
    .gte('start_time', now)
    .lte('start_time', weekFromNow)
    .order('start_time', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching calendar events:', error)
    return []
  }

  return (data || []).map(event => ({
    id: event.id,
    title: event.title,
    startTime: new Date(event.start_time),
    endTime: new Date(event.end_time),
    location: event.location || undefined,
    isAllDay: event.is_all_day || false,
  }))
}

export async function getTodaysEvents(): Promise<CalendarEventSummary[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, title, start_time, end_time, location, is_all_day')
    .eq('user_id', USER_ID)
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching today events:', error)
    return []
  }

  return (data || []).map(event => ({
    id: event.id,
    title: event.title,
    startTime: new Date(event.start_time),
    endTime: new Date(event.end_time),
    location: event.location || undefined,
    isAllDay: event.is_all_day || false,
  }))
}

// =====================================================
// Task Services
// =====================================================

export async function getAgentTasks(): Promise<AgentTask[]> {
  const { data, error } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching agent tasks:', error)
    
    // Fallback to todos table
    const { data: todoData, error: todoError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false })
      .limit(50)

    if (todoError) {
      console.error('Error fetching todos:', todoError)
      return []
    }

    return (todoData || []).map(todo => ({
      id: todo.id,
      user_id: todo.user_id,
      title: todo.title,
      status: mapTodoStatus(todo.status),
      priority: todo.priority || 'medium',
      notes: todo.description,
      assigned_by: 'user',
      tags: todo.tags || [],
      metadata: todo.metadata || {},
      created_at: todo.created_at,
      updated_at: todo.updated_at,
    }))
  }

  return data || []
}

// =====================================================
// Activity Services
// =====================================================

export async function getAgentActivity(limit = 20): Promise<AgentActivity[]> {
  const { data, error } = await supabase
    .from('agent_activities')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching agent activities:', error)
    return []
  }

  return data || []
}

// =====================================================
// Documents Services
// =====================================================

export async function getAgentDocuments(limit = 20): Promise<AgentDocument[]> {
  const { data, error } = await supabase
    .from('agent_documents')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching agent documents:', error)
    return []
  }

  return data || []
}

// =====================================================
// Projects Services
// =====================================================

export async function getAgentProjects(): Promise<AgentProject[]> {
  const { data, error } = await supabase
    .from('vault_projects')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching agent projects:', error)
    return []
  }

  // Transform the data to match AgentProject interface
  return (data || []).map(project => ({
    id: project.id,
    user_id: project.user_id,
    name: project.name,
    description: project.description,
    status: project.status,
    color: project.color_tag || '#3b82f6',
    icon: project.icon,
    priority: 'medium',
    tasks_total: 0, // Will need to calculate this
    tasks_completed: 0,
    last_activity_at: project.updated_at,
    tags: [],
    metadata: {},
    created_at: project.created_at,
    updated_at: project.updated_at,
  }))
}

// =====================================================
// Deliverables Services
// =====================================================

export async function getAgentDeliverables(limit = 10): Promise<AgentDeliverable[]> {
  const { data, error } = await supabase
    .from('agent_activities')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('activity_type', 'deliverable')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching agent deliverables:', error)
    return []
  }

  return (data || []).map(activity => ({
    id: activity.id,
    user_id: activity.user_id,
    title: activity.title,
    deliverable_type: activity.metadata?.deliverable_type || 'document',
    date: activity.created_at.split('T')[0],
    content: activity.description,
    is_pinned: activity.is_pinned,
    metadata: activity.metadata || {},
    created_at: activity.created_at,
  }))
}

// =====================================================
// Workflows Services
// =====================================================

export async function getScheduledWorkflows(): Promise<AgentScheduledWorkflow[]> {
  const { data, error } = await supabase
    .from('agent_scheduled_workflows')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching scheduled workflows:', error)
    return []
  }

  return data || []
}

// =====================================================
// Notes Services
// =====================================================

export async function getAgentNotes(limit = 10): Promise<AgentNote[]> {
  const { data, error } = await supabase
    .from('agent_notes')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching agent notes:', error)
    return []
  }

  return data || []
}

export async function createQuickNote(content: string): Promise<AgentNote | null> {
  const { data, error } = await supabase
    .from('agent_notes')
    .insert({
      user_id: USER_ID,
      content,
      is_read: false,
      is_processed: false,
      tags: [],
      metadata: {},
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating quick note:', error)
    return null
  }

  return data
}

// =====================================================
// Notifications Services
// =====================================================

export async function getAgentNotifications(limit = 10): Promise<AgentNotification[]> {
  const { data, error } = await supabase
    .from('agent_notifications')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data || []
}

// =====================================================
// Dashboard Stats
// =====================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const [tasksResult, eventsResult, notificationsResult] = await Promise.all([
    getAgentTasks(),
    getUpcomingEvents(100),
    getAgentNotifications(100),
  ])

  const completed = tasksResult.filter(t => t.status === 'done').length
  const inProgress = tasksResult.filter(t => t.status === 'in_progress').length
  const unreadNotifications = notificationsResult.filter(n => !n.is_read).length

  return {
    tasksCompleted: completed,
    tasksInProgress: inProgress,
    upcomingEvents: eventsResult.length,
    unreadNotifications,
  }
}

// =====================================================
// System Health
// =====================================================

export async function getSystemHealth(): Promise<SystemHealth> {
  // Mock system health data - in production this would come from monitoring
  return {
    status: 'healthy',
    uptime: Date.now() - new Date('2026-02-01').getTime(),
    memoryUsage: Math.random() * 100,
    cpuUsage: Math.random() * 100,
    lastCheck: new Date(),
  }
}

// =====================================================
// Utility Functions
// =====================================================

function mapTodoStatus(status: string): AgentTask['status'] {
  switch (status) {
    case 'done':
    case 'completed':
      return 'done'
    case 'in-progress':
    case 'in_progress':
      return 'in_progress'
    case 'blocked':
      return 'archive'
    default:
      return 'todo'
  }
}

export async function logAgentActivity(activity: Omit<AgentActivity, 'id' | 'user_id' | 'created_at'>): Promise<void> {
  const { error } = await supabase
    .from('agent_activities')
    .insert({
      user_id: USER_ID,
      ...activity,
    })

  if (error) {
    console.error('Error logging agent activity:', error)
  }
}