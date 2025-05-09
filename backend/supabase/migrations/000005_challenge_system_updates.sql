-- Migration file to update existing tables for the FrontierOdyssey Challenge System
-- Modifies challenges, mastery_logs, messages, and feedback tables to support challenge system requirements
-- Aligns with requirements (artifact ID 912fbfcc-9520-4f31-8345-4684d5ac591c) and new tables (artifact ID a46db503-31cd-449b-9ece-82045b127934)
-- Ensures compatibility with existing schema (000001_initial_schema.sql, 000002_user_profile.sql, 000003_message_rls.sql)

-- Update challenges table: Add title 
ALTER TABLE public.challenges
  ADD COLUMN title VARCHAR(100) NOT NULL DEFAULT 'Untitled Challenge';

-- Update mastery_logs table: Add task_completion_count
ALTER TABLE public.mastery_logs
  ADD COLUMN task_completion_count INT CHECK (task_completion_count >= 0) DEFAULT 0;

-- Update messages table: Add CHECK constraint for topic
ALTER TABLE public.messages
  ADD CONSTRAINT check_topic CHECK (topic IN ('onboarding', 'challenge'));

-- Update feedback table: Modify context CHECK constraint
ALTER TABLE public.feedback
  DROP CONSTRAINT feedback_context_check,
  ADD CONSTRAINT feedback_context_check CHECK (context IN ('onboarding', 'survey', 'challenge'));

-- Add index for challenges.title to improve UI search/filtering
CREATE INDEX idx_challenges_title ON public.challenges(title);

-- Comment to document default title usage
COMMENT ON COLUMN public.challenges.title IS 'User-friendly title for the challenge, defaults to ''Untitled Challenge'' if not specified';
COMMENT ON COLUMN public.challenges.difficulty_level IS 'Difficulty level of the challenge (beginner, intermediate, advanced), nullable for flexibility';
COMMENT ON COLUMN public.mastery_logs.task_completion_count IS 'Number of tasks completed in the challenge, synced with task_progress';