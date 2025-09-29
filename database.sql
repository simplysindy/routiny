-- Routiny Database Schema
-- This file should be executed in your Supabase SQL editor

-- Create custom types
CREATE TYPE coach_personality AS ENUM ('encouraging', 'neutral', 'playful');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE theme_type AS ENUM ('light', 'dark', 'auto');

-- Create user preferences type
CREATE TYPE user_preferences AS (
  coach_personality coach_personality,
  notification_enabled boolean,
  theme theme_type
);

-- Create users table (extends auth.users)
CREATE TABLE users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL UNIQUE,
  streak_count integer DEFAULT 0 NOT NULL,
  total_tasks_completed integer DEFAULT 0 NOT NULL,
  preferences jsonb DEFAULT '{"coach_personality": "encouraging", "notification_enabled": true, "theme": "auto"}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_active timestamptz DEFAULT now() NOT NULL
);

-- Create tasks table
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  ai_breakdown text[] DEFAULT '{}' NOT NULL,
  status task_status DEFAULT 'pending' NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create task_steps table
CREATE TABLE task_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  step_text text NOT NULL,
  order_index integer NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(task_id, order_index)
);

-- Create indexes for performance
CREATE INDEX idx_users_last_active ON users(last_active);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX idx_task_steps_order ON task_steps(task_id, order_index);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks table policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Task steps table policies
CREATE POLICY "Users can view own task steps" ON task_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_steps.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own task steps" ON task_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_steps.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own task steps" ON task_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_steps.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own task steps" ON task_steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_steps.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Database triggers for automatic streak calculation
CREATE OR REPLACE FUNCTION update_task_completion_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total tasks completed when a task is marked as completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE users 
    SET total_tasks_completed = total_tasks_completed + 1,
        last_active = now()
    WHERE id = NEW.user_id;
  END IF;
  
  -- Reset completed_at when task is uncompleted
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at := NULL;
    UPDATE users 
    SET total_tasks_completed = GREATEST(total_tasks_completed - 1, 0)
    WHERE id = NEW.user_id;
  END IF;
  
  -- Set completed_at when task is completed
  IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_completion_stats
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_completion_stats();

-- Function to create user profile on auth signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, preferences)
  VALUES (
    NEW.id, 
    NEW.email,
    '{"coach_personality": "encouraging", "notification_enabled": true, "theme": "auto"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to safely increment tasks completed
CREATE OR REPLACE FUNCTION increment_tasks_completed(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET total_tasks_completed = total_tasks_completed + 1,
      last_active = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;