-- Fix current_day constraint to include upper bound check
-- This ensures current_day cannot exceed duration_days

-- Drop existing constraint (if it exists with a specific name)
-- The constraint name may vary, so we drop if exists
DO $$
BEGIN
    -- Drop constraint if it exists
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_current_day_check;
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_current_day_check1;
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add new constraint with proper bounds
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_current_day_check
CHECK (current_day > 0 AND current_day <= duration_days);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT tasks_current_day_check ON public.tasks IS
'Ensures current_day is positive and does not exceed the total duration_days of the task';
