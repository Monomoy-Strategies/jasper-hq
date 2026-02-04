// Jasper HQ Types - Adapted from Vortxx Agent Dashboard

// =====================================================
// Core Dashboard Types
// =====================================================

export interface AgentTask {
  id: string
  user_id: string
  title: string
  status: 'todo' | 'in_progress' | 'done' | 'archive'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  project_id?: string
  notes?: string
  assigned_by: 'user' | 'agent' | 'system'
  estimated_minutes?: number
  actual_minutes?: number
  started_at?: string
  completed_at?: string
  due_date?: string
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AgentDocument {
  id: string
  user_id: string
  title: string
  content: string
  doc_type: 'report' | 'guide' | 'spec' | 'briefing' | 'summary' | 'note' | 'other'
  category?: string
  is_pinned: boolean
  is_archived: boolean
  word_count?: number
  read_time_minutes?: number
  tags: string[]
  related_entity_type?: string
  related_entity_id?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AgentNote {
  id: string
  user_id: string
  content: string
  is_read: boolean
  is_processed: boolean
  processed_at?: string
  response?: string
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AgentProject {
  id: string
  user_id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  color: string
  icon?: string
  priority: 'low' | 'medium' | 'high'
  tasks_total: number
  tasks_completed: number
  last_activity_at?: string
  github_repo?: string
  folder_path?: string
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AgentDeliverable {
  id: string
  user_id: string
  title: string
  deliverable_type: 'daily_briefing' | 'security_audit' | 'idea' | 'report' | 'document'
  date: string
  content?: string
  file_path?: string
  url?: string
  is_pinned: boolean
  project_id?: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface AgentScheduledWorkflow {
  id: string
  user_id: string
  name: string
  description?: string
  cron_expression: string
  workflow_type: string
  is_active: boolean
  last_run_at?: string
  next_run_at?: string
  last_run_status?: 'success' | 'failure' | 'running' | 'skipped'
  last_run_message?: string
  run_count: number
  failure_count: number
  config: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AgentActivity {
  id: string
  user_id: string
  session_id?: string
  activity_type: ActivityType
  category: 'work' | 'personal' | 'system' | 'communication' | 'research' | 'general'
  title: string
  description?: string
  related_entity_type?: string
  related_entity_id?: string
  importance: 'low' | 'normal' | 'high' | 'critical'
  is_visible: boolean
  is_pinned: boolean
  metadata: Record<string, unknown>
  tags: string[]
  created_at: string
}

export interface AgentNotification {
  id: string
  user_id: string
  session_id?: string
  notification_type: 'info' | 'action_required' | 'warning' | 'error' | 'success' | 'reminder' | 'idea'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  title: string
  description?: string
  action_url?: string
  action_label?: string
  action_data?: Record<string, unknown>
  related_entity_type?: string
  related_entity_id?: string
  is_read: boolean
  is_dismissed: boolean
  read_at?: string
  dismissed_at?: string
  show_after: string
  expires_at?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CalendarEventSummary {
  id: string
  title: string
  startTime: Date
  endTime: Date
  location?: string
  isAllDay: boolean
}

export interface LiveStatus {
  status: 'idle' | 'working' | 'thinking'
  currentTask?: string
  lastActivity: Date
  model: string
  sessionId?: string
  channel?: string
  metrics?: {
    messages: number
    toolCalls: number
    tokensIn: number
    tokensOut: number
  }
}

export interface DashboardStats {
  tasksCompleted: number
  tasksInProgress: number
  upcomingEvents: number
  unreadNotifications: number
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  memoryUsage: number
  cpuUsage: number
  lastCheck: Date
}

// =====================================================
// Types & Enums
// =====================================================

export type ActivityFilterType = 'all' | 'email' | 'code' | 'research' | 'file' | 'system' | 'communication'

export type ActivityType = 
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'email_sent'
  | 'email_drafted'
  | 'email_processed'
  | 'calendar_created'
  | 'calendar_updated'
  | 'search_performed'
  | 'file_created'
  | 'file_updated'
  | 'code_generated'
  | 'message_sent'
  | 'research_completed'
  | 'error_occurred'
  | 'session_started'
  | 'session_ended'
  | 'notification_created'
  | 'idea_generated'
  | 'deliverable'
  | 'general'

// =====================================================
// Configuration Objects
// =====================================================

// Document type config with Jasper's navy/gold theme
export const documentTypeConfig = {
  report: { icon: '📊', label: 'Report', color: 'bg-blue-900/20 text-blue-300 border-blue-500/30' },
  guide: { icon: '📖', label: 'Guide', color: 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30' },
  spec: { icon: '📋', label: 'Spec', color: 'bg-purple-900/20 text-purple-300 border-purple-500/30' },
  briefing: { icon: '📝', label: 'Briefing', color: 'bg-amber-900/20 text-amber-300 border-amber-500/30' },
  summary: { icon: '📄', label: 'Summary', color: 'bg-cyan-900/20 text-cyan-300 border-cyan-500/30' },
  note: { icon: '🗒️', label: 'Note', color: 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30' },
  other: { icon: '📁', label: 'Other', color: 'bg-slate-700/20 text-slate-300 border-slate-500/30' },
}

// Workflow status colors with dark theme
export const workflowStatusColors = {
  success: 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30',
  failure: 'bg-red-900/20 text-red-300 border-red-500/30',
  running: 'bg-blue-900/20 text-blue-300 border-blue-500/30',
  skipped: 'bg-slate-700/20 text-slate-300 border-slate-500/30',
}

// Activity icon mapping
export const activityIcons: Record<ActivityType, string> = {
  task_created: '📝',
  task_completed: '✅',
  task_updated: '📋',
  email_sent: '📤',
  email_drafted: '✉️',
  email_processed: '📧',
  calendar_created: '📅',
  calendar_updated: '🗓️',
  search_performed: '🔍',
  file_created: '📄',
  file_updated: '📁',
  code_generated: '💻',
  message_sent: '💬',
  research_completed: '🔬',
  error_occurred: '⚠️',
  session_started: '🟢',
  session_ended: '🔴',
  notification_created: '🔔',
  idea_generated: '💡',
  deliverable: '🎯',
  general: '📌',
}

// Notification type config
export const notificationConfig = {
  info: { color: 'blue', icon: 'Info' },
  action_required: { color: 'amber', icon: 'AlertCircle' },
  warning: { color: 'yellow', icon: 'AlertTriangle' },
  error: { color: 'red', icon: 'XCircle' },
  success: { color: 'emerald', icon: 'CheckCircle' },
  reminder: { color: 'purple', icon: 'Bell' },
  idea: { color: 'amber', icon: 'Lightbulb' },
}

// Priority colors with dark theme
export const priorityColors = {
  low: 'bg-slate-700/20 text-slate-300 border-slate-500/30',
  medium: 'bg-blue-900/20 text-blue-300 border-blue-500/30',
  high: 'bg-amber-900/20 text-amber-300 border-amber-500/30',
  urgent: 'bg-red-900/20 text-red-300 border-red-500/30',
}

// Task status colors
export const taskStatusColors = {
  todo: 'bg-slate-700/20 text-slate-300 border-slate-500/30',
  in_progress: 'bg-blue-900/20 text-blue-300 border-blue-500/30',
  done: 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30',
  archive: 'bg-gray-700/20 text-gray-400 border-gray-500/30',
}

// Category colors for activity badges
export const categoryColors = {
  work: 'bg-blue-900/20 text-blue-300 border-blue-500/30',
  personal: 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30',
  system: 'bg-slate-700/20 text-slate-300 border-slate-500/30',
  communication: 'bg-purple-900/20 text-purple-300 border-purple-500/30',
  research: 'bg-amber-900/20 text-amber-300 border-amber-500/30',
  general: 'bg-slate-700/20 text-slate-300 border-slate-500/30',
}