import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface SessionContext {
  used: number
  total: number
  pct: number
  model: string
}

interface SessionEntry {
  key: string
  label: string
  kind: string
  age: string
  model: string
  used: number
  total: number
  pct: number
}

export interface SecurityData {
  system: {
    openclawVersion: string
    latestVersion: string
    updateAvailable: boolean
    criticalUpdate?: boolean
    nodeVersion: string
    os: string
    uptime: string
    lastUpdate: string
  }
  context?: {
    used: number
    total: number
    discord?: SessionContext | null
    main?: SessionContext | null
    sessions?: SessionEntry[]
  }
  audit: {
    overall: 'green' | 'yellow' | 'red'
    critical: number
    warnings: number
    info: number
    lastAudit: string
    findings: Array<{
      level: 'critical' | 'warning' | 'info'
      id: string
      message: string
    }>
  }
  network: {
    gateway: 'running' | 'stopped'
    bind: string
    port: number
    firewall: 'active' | 'inactive'
    ssh: 'enabled' | 'disabled'
    exposedServices: string[]
  }
  services: Array<{
    name: string
    status: 'connected' | 'disconnected' | 'running' | 'stopped' | 'reachable' | 'unreachable' | 'active'
    detail: string
  }>
  events: Array<{
    time: string
    type: 'update' | 'audit' | 'fix' | 'milestone' | 'error' | 'warning'
    message: string
  }>
  heartbeatGuard: {
    defenderStatus: 'active' | 'inactive' | 'unknown'
    lastScan: string
    definitionsAge: string
    pendingUpdates: number
    diskEncryption: string
    credentialReview: string
  }
  _meta?: {
    source: 'live' | 'mock'
    lastUpdate: string
    machineId: string
  }
}

// Mock data - fallback when Supabase is unavailable
const mockSecurityData: SecurityData = {
  system: {
    openclawVersion: '2026.2.15',
    latestVersion: '2026.2.15',
    updateAvailable: false,
    nodeVersion: 'v24.13.1',
    os: 'Windows 10.0.26100 (x64)',
    uptime: '2h 15m',
    lastUpdate: '2026-02-16T08:40:00Z',
  },
  context: {
    used: 45000,
    total: 200000,
    discord: {
      used: 32000,
      total: 200000,
      pct: 16,
      model: 'claude-opus-4-6',
    },
    main: {
      used: 78000,
      total: 200000,
      pct: 39,
      model: 'claude-opus-4-6',
    },
    sessions: [
      {
        key: 'discord:channel:1470088457178054677',
        label: 'Discord #jasper',
        kind: 'channel',
        age: '45m',
        model: 'claude-opus-4-6',
        used: 32000,
        total: 200000,
        pct: 16,
      },
      {
        key: 'telegram:user:123456',
        label: 'Main (Telegram)',
        kind: 'user',
        age: '2h',
        model: 'claude-opus-4-6',
        used: 78000,
        total: 200000,
        pct: 39,
      },
      {
        key: 'subagent:jasper-hq-context-bars',
        label: 'Subagent: jasper-hq',
        kind: 'subagent',
        age: '5m',
        model: 'claude-opus-4-6',
        used: 12000,
        total: 200000,
        pct: 6,
      },
    ],
  },
  audit: {
    overall: 'green',
    critical: 0,
    warnings: 0,
    info: 1,
    lastAudit: '2026-02-16T08:35:00Z',
    findings: [
      {
        level: 'info',
        id: 'summary.attack_surface',
        message: 'Attack surface summary: open=0, allowlist=2',
      },
    ],
  },
  network: {
    gateway: 'running',
    bind: 'tailnet (100.70.233.52)',
    port: 41893,
    firewall: 'active',
    ssh: 'disabled',
    exposedServices: [],
  },
  services: [
    { name: 'Discord', status: 'connected', detail: '2 channels active' },
    { name: 'Telegram', status: 'connected', detail: '1 account' },
    { name: 'Supabase', status: 'reachable', detail: 'cymfsifrjcisncnzywbd' },
    { name: 'n8n', status: 'running', detail: 'Monomoy-2 (100.106.250.119:5678)' },
    { name: 'Ollama', status: 'stopped', detail: 'Local LLMs' },
    { name: 'Cron', status: 'active', detail: '8 jobs, next run in 2h' },
  ],
  events: [
    {
      time: '2026-02-16T08:40:00Z',
      type: 'update',
      message: 'OpenClaw updated 2026.2.14 → 2026.2.15',
    },
    {
      time: '2026-02-16T08:35:00Z',
      type: 'audit',
      message: 'Security audit passed: 0 critical, 0 warnings',
    },
    {
      time: '2026-02-16T08:30:00Z',
      type: 'fix',
      message: 'Fixed 4 cron jobs: Discord delivery target format',
    },
    {
      time: '2026-02-15T17:15:00Z',
      type: 'milestone',
      message: 'Gateway Migration Phase 2 complete',
    },
  ],
  heartbeatGuard: {
    defenderStatus: 'active',
    lastScan: '2026-02-16T02:00:00Z',
    definitionsAge: '< 24h',
    pendingUpdates: 0,
    diskEncryption: 'BitLocker enabled',
    credentialReview: '2026-02-09',
  },
}

// Create Supabase client with service role for server-side reads
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !serviceKey) {
    console.warn('Supabase credentials not configured')
    return null
  }
  
  return createClient(supabaseUrl, serviceKey)
}

export async function GET() {
  const supabase = getSupabaseClient()
  
  if (supabase) {
    try {
      // Fetch from security_status table
      const { data, error } = await supabase
        .from('security_status')
        .select('data, updated_at')
        .eq('machine_id', 'monomoy-1')
        .single()
      
      if (error) {
        console.error('Supabase fetch error:', error.message)
        // Fall through to mock data
      } else if (data?.data) {
        // Return live data with metadata
        const securityData = data.data as SecurityData
        securityData._meta = {
          source: 'live',
          lastUpdate: data.updated_at,
          machineId: 'monomoy-1'
        }
        return NextResponse.json(securityData)
      }
    } catch (err) {
      console.error('Supabase connection error:', err)
    }
  }
  
  // Fallback to mock data
  const response = { 
    ...mockSecurityData,
    _meta: {
      source: 'mock' as const,
      lastUpdate: new Date().toISOString(),
      machineId: 'mock'
    }
  }
  
  return NextResponse.json(response)
}
