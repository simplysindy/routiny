-- Migration: Add duration fields to tasks table (Story 1.4)
-- This migration adds support for multi-day tasks and habits

-- Add new columns to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 1 CHECK (duration_days > 0);

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS task_type TEXT CHECK (task_type IN ('single-day', 'multi-day')) DEFAULT 'single-day';

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS current_day INTEGER DEFAULT 1 CHECK (current_day > 0 AND current_day <= duration_days);

-- Convert ai_breakdown from TEXT[] to JSONB if needed
-- This allows storing both flat arrays and day-structured JSON
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
    AND column_name = 'ai_breakdown'
    AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE tasks
    ALTER COLUMN ai_breakdown TYPE JSONB USING to_jsonb(ai_breakdown);
  END IF;
END $$;

-- Update existing tasks to have default values
UPDATE tasks
SET
  duration_days = COALESCE(duration_days, 1),
  task_type = COALESCE(task_type, 'single-day'),
  current_day = COALESCE(current_day, 1)
WHERE duration_days IS NULL OR task_type IS NULL OR current_day IS NULL;
