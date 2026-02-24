-- ============================================================
-- AI Metrics Table Migration
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cymfsifrjcisncnzywbd/sql
--
-- AIDEN INTEGRATION NOTE:
-- This table is the data backbone for AIDEN (AI Executive Navigator).
-- When AIDEN is built, wire it here for real-time ROI reporting,
-- spend alerts, trend analysis, and executive dashboards.
-- ============================================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.ai_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name text NOT NULL,
  metric_date date NOT NULL,
  api_calls integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10, 4) NOT NULL DEFAULT 0,
  estimated_minutes_saved numeric(10, 2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_metrics_tool_date_unique UNIQUE(tool_name, metric_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS ai_metrics_date_idx ON public.ai_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS ai_metrics_tool_idx ON public.ai_metrics(tool_name);

-- Enable RLS
ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for server-side API routes)
DROP POLICY IF EXISTS "Service role full access" ON public.ai_metrics;
CREATE POLICY "Service role full access" ON public.ai_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed with 35 days of realistic mock data
-- (Run the Node seed script after this, or insert manually)
-- Example seed for a single day:
INSERT INTO public.ai_metrics (tool_name, metric_date, api_calls, estimated_cost_usd, estimated_minutes_saved, notes)
VALUES
  ('Anthropic/Claude', CURRENT_DATE, 152, 40.23, 228.5, NULL),
  ('OpenAI', CURRENT_DATE, 44, 11.87, 63.0, NULL),
  ('xAI/Grok', CURRENT_DATE, 19, 7.62, 38.5, NULL),
  ('ElevenLabs TTS', CURRENT_DATE, 32, 3.95, 17.2, NULL),
  ('Firecrawl', CURRENT_DATE, 16, 5.88, 53.0, NULL),
  ('OpenClaw', CURRENT_DATE, 195, 0.9667, 179.3, NULL)
ON CONFLICT (tool_name, metric_date) DO NOTHING;

SELECT 'Migration complete. Run node scripts/seed-ai-metrics.js to seed 35 days of data.' as status;
