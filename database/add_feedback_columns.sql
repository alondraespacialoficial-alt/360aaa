-- Añadir columnas para feedback en ai_usage_tracking (no destructivo)
ALTER TABLE public.ai_usage_tracking
  ADD COLUMN IF NOT EXISTS user_feedback boolean,
  ADD COLUMN IF NOT EXISTS feedback_comment text,
  ADD COLUMN IF NOT EXISTS feedback_at timestamptz DEFAULT NULL;

-- Índice para consultas por feedback_at
CREATE INDEX IF NOT EXISTS idx_ai_usage_feedback_at ON public.ai_usage_tracking (feedback_at);

-- Nota: ejecutar en Supabase SQL Editor como administrador.
