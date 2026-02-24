/**
 * Vortxx Calendar Integration Script
 * Allows Jasper to read and write calendar events to/from Vortxx Supabase
 * 
 * Usage:
 *   node vortxx-calendar.js upcoming [--days 30]
 *   node vortxx-calendar.js today
 *   node vortxx-calendar.js add --title "..." --date "YYYY-MM-DD" --time "HH:MM" [--duration 60] [--desc "..."] [--location "..."] [--allday] [--category personal|business]
 *   node vortxx-calendar.js delete --id <uuid>
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local from this directory
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const env = {}
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  }
  return env
}

const env = loadEnvLocal()
const SUPABASE_URL = env.SUPABASE_URL || 'https://cymfsifrjcisncnzywbd.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY
const BILL_USER_ID = '1cfef549-ae52-4824-808b-7bfafb303adc'

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local or environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Parse command line args
const args = process.argv.slice(2)
const command = args[0]

function getArg(name, defaultVal = null) {
  const idx = args.indexOf('--' + name)
  if (idx === -1) return defaultVal
  return args[idx + 1] || defaultVal
}

function hasFlag(name) {
  return args.includes('--' + name)
}

async function listUpcoming(days = 30) {
  const now = new Date()
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, title, description, start_time, end_time, is_all_day, location, category, is_recurring, recurrence_pattern')
    .eq('user_id', BILL_USER_ID)
    .gte('start_time', now.toISOString())
    .lte('start_time', future.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log(`No events in next ${days} days.`)
    return []
  }

  console.log(`\n=== Upcoming Events (next ${days} days) ===\n`)
  data.forEach(e => {
    const start = new Date(e.start_time)
    const dateStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
    const timeStr = e.is_all_day ? '(all day)' : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'America/New_York' })
    console.log(`[CALENDAR] ${dateStr} at ${timeStr}`)
    console.log(`   Title: ${e.title}`)
    if (e.description) console.log(`   Notes: ${e.description}`)
    if (e.location) console.log(`   Location: ${e.location}`)
    console.log(`   Category: ${e.category} | ID: ${e.id}`)
    if (e.is_recurring) console.log(`   Recurring: ${e.recurrence_pattern}`)
    console.log('')
  })

  return data
}

async function addEvent({ title, description, date, time, duration, isAllDay, location, category, isRecurring, recurrencePattern }) {
  if (!title || !date) {
    console.error('ERROR: --title and --date are required')
    process.exit(1)
  }

  let startTimestamp, endTimestamp

  if (isAllDay) {
    // All-day: store at noon UTC for the given date to avoid timezone date-shift issues
    const [year, month, day] = date.split('-').map(Number)
    startTimestamp = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString()
    endTimestamp = new Date(Date.UTC(year, month - 1, day, 23, 59, 59)).toISOString()
  } else {
    if (!time) {
      console.error('ERROR: --time is required for non-all-day events (format: HH:MM)')
      process.exit(1)
    }
    const [hours, minutes] = time.split(':').map(Number)
    const [year, month, day] = date.split('-').map(Number)
    const durationMins = parseInt(duration) || 60

    // Create as local machine time (Monomoy-1 is EST/EDT)
    const startLocal = new Date(year, month - 1, day, hours, minutes, 0)
    const endLocal = new Date(startLocal.getTime() + durationMins * 60000)
    startTimestamp = startLocal.toISOString()
    endTimestamp = endLocal.toISOString()
  }

  const eventData = {
    user_id: BILL_USER_ID,
    title: title.trim(),
    description: description || null,
    start_time: startTimestamp,
    end_time: endTimestamp,
    is_all_day: isAllDay || false,
    location: location || null,
    attendees: [],
    attendee_contact_ids: [],
    color: null,
    recurrence: null,
    reminders: [],
    source: 'manual',
    category: category || 'personal',
    event_type: 'meeting',
    is_recurring: isRecurring || false,
    recurrence_pattern: isRecurring ? (recurrencePattern || 'weekly') : null,
    recurrence_interval: 1,
    recurrence_days_of_week: null,
    recurrence_end_date: null,
    recurrence_end_count: null,
    parent_event_id: null,
    is_exception_instance: false,
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert(eventData)
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error.message)
    process.exit(1)
  }

  const start = new Date(data.start_time)
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
  const timeStr = isAllDay ? '(all day)' : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'America/New_York' })

  console.log(`\n[OK] Event created: "${data.title}"`)
  console.log(`     Date: ${dateStr}`)
  console.log(`     Time: ${timeStr}`)
  if (location) console.log(`     Location: ${location}`)
  console.log(`     ID: ${data.id}`)

  return data
}

async function deleteEvent(id) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', BILL_USER_ID)

  if (error) {
    console.error('Error deleting event:', error.message)
    process.exit(1)
  }
  console.log(`[OK] Event ${id} deleted.`)
}

async function getTodayEvents() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', BILL_USER_ID)
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching today events:', error.message)
    process.exit(1)
  }

  const label = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
  console.log(`\n=== Today's Events (${label}) ===\n`)

  if (!data || data.length === 0) {
    console.log('No events scheduled for today.')
    return []
  }

  data.forEach(e => {
    const start = new Date(e.start_time)
    const timeStr = e.is_all_day ? '(all day)' : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
    console.log(`${timeStr} — ${e.title}`)
    if (e.location) console.log(`  Location: ${e.location}`)
    if (e.description) console.log(`  Notes: ${e.description}`)
  })

  return data
}

// Main execution
;(async () => {
  switch (command) {
    case 'list':
    case 'upcoming': {
      const days = parseInt(getArg('days', '30'))
      await listUpcoming(days)
      break
    }
    case 'today': {
      await getTodayEvents()
      break
    }
    case 'add': {
      await addEvent({
        title: getArg('title'),
        date: getArg('date'),
        time: getArg('time'),
        duration: getArg('duration', '60'),
        description: getArg('desc') || getArg('description'),
        location: getArg('location') || getArg('loc'),
        category: getArg('category', 'personal'),
        isAllDay: hasFlag('allday') || hasFlag('all-day'),
        isRecurring: hasFlag('recurring'),
        recurrencePattern: getArg('recurrence', 'weekly'),
      })
      break
    }
    case 'delete': {
      const id = getArg('id') || args[1]
      if (!id) { console.error('ERROR: --id required'); process.exit(1) }
      await deleteEvent(id)
      break
    }
    default: {
      console.log(`
Vortxx Calendar - Jasper Integration

Commands:
  upcoming [--days 30]              List upcoming events (default 30 days)
  today                             List today's events
  add --title "..." --date YYYY-MM-DD --time HH:MM [--duration mins] [--desc "..."] [--location "..."] [--category personal|business] [--allday]
  delete --id <uuid>

Examples:
  node vortxx-calendar.js today
  node vortxx-calendar.js upcoming --days 14
  node vortxx-calendar.js add --title "Dr. Smith" --date 2026-03-30 --time 10:00 --duration 60 --location "Mass General, Boston"
  node vortxx-calendar.js add --title "Susan Birthday Trip" --date 2026-04-18 --allday --desc "Cliff House Maine"
      `)
    }
  }
})()
