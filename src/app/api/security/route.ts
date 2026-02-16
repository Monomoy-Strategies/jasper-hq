import { NextResponse } from 'next/server'

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
}

// Mock data - will be replaced with real system checks later
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

export async function GET() {
  // TODO: Replace with real system checks:
  // - openclaw security audit
  // - openclaw gateway status
  // - Service health checks
  // - Windows Defender status via PowerShell
  // - Windows Update status
  
  return NextResponse.json(mockSecurityData)
}
