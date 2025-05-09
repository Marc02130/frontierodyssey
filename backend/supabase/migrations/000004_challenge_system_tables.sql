-- Migration file for new tables to support the FrontierOdyssey Challenge System
-- Adds tables for in-progress task states, task-specific feedback, and challenge recommendations
-- Aligns with challenge system requirements (artifact ID 912fbfcc-9520-4f31-8345-4684d5ac591c)
-- Integrates with existing schema (000001_initial_schema.sql, 000002_user_profile.sql, 000003_message_rls.sql)
-- Includes RLS policies and indices for performance

-- task_progress: Stores in-progress task states for challenges
CREATE TABLE public.task_progress (
  progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(challenge_id) ON DELETE CASCADE,
  task_index INT NOT NULL CHECK (task_index >= 0), -- Index of task in challenges.tasks JSONB (e.g., 1 for task1)
  response JSONB, -- Student response (e.g., {"answer": "100 kW", "correct": true})
  is_completed BOOLEAN DEFAULT FALSE, -- True if task is fully completed
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- task_feedback: Stores task-specific feedback for engagement analysis
CREATE TABLE public.task_feedback (
  feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(challenge_id) ON DELETE CASCADE,
  task_index INT NOT NULL CHECK (task_index >= 0), -- Index of task in challenges.tasks JSONB
  rating BOOLEAN NOT NULL, -- True for thumbs up, false for thumbs down
  is_mid_task BOOLEAN NOT NULL DEFAULT FALSE, -- True for mid-task feedback, false for end-of-task
  comment TEXT, -- Optional student comment (e.g., "This was tricky!")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- challenge_recommendations: Caches recommended challenges for performance
CREATE TABLE public.challenge_recommendations (
  recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(challenge_id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL CHECK (subject IN ('Math', 'Science', 'English')),
  elo_rating INT NOT NULL CHECK (elo_rating >= 0), -- ELO of recommended challenge
  recommendation_score DECIMAL(5,2) CHECK (recommendation_score BETWEEN 0 AND 100), -- Score based on ELO match and interests
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 day') -- Recommendations expire after 24 hours
);

-- Indices for performance
CREATE INDEX idx_task_progress_user_challenge ON public.task_progress(user_id, challenge_id, task_index);
CREATE INDEX idx_task_feedback_user_challenge ON public.task_feedback(user_id, challenge_id, task_index);
CREATE INDEX idx_challenge_recommendations_user ON public.challenge_recommendations(user_id, created_at DESC);

-- Enable RLS for new tables
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_progress
CREATE POLICY task_progress_select ON public.task_progress FOR SELECT USING (
  user_id = auth.uid() OR has_role('admin')
);
CREATE POLICY task_progress_insert ON public.task_progress FOR INSERT WITH CHECK (
  user_id = auth.uid() OR has_role('admin')
);
CREATE POLICY task_progress_update ON public.task_progress FOR UPDATE USING (
  user_id = auth.uid() OR has_role('admin')
) WITH CHECK (
  user_id = auth.uid() OR has_role('admin')
);
CREATE POLICY task_progress_delete ON public.task_progress FOR DELETE USING (
  has_role('admin')
);

-- RLS Policies for task_feedback
CREATE POLICY task_feedback_select ON public.task_feedback FOR SELECT USING (
  user_id = auth.uid() OR has_role('admin')
);
CREATE POLICY task_feedback_insert ON public.task_feedback FOR INSERT WITH CHECK (
  user_id = auth.uid() OR has_role('admin')
);
CREATE POLICY task_feedback_update ON public.task_feedback FOR UPDATE USING (
  has_role('admin')
) WITH CHECK (
  has_role('admin')
);
CREATE POLICY task_feedback_delete ON public.task_feedback FOR DELETE USING (
  has_role('admin')
);

-- RLS Policies for challenge_recommendations
CREATE POLICY challenge_recommendations_select ON public.challenge_recommendations FOR SELECT USING (
  user_id = auth.uid() OR has_role('admin')
);
CREATE POLICY challenge_recommendations_insert ON public.challenge_recommendations FOR INSERT WITH CHECK (
  user_id = auth.uid() OR has_role('admin')
);
CREATE POLICY challenge_recommendations_update ON public.challenge_recommendations FOR UPDATE USING (
  has_role('admin')
) WITH CHECK (
  has_role('admin')
);
CREATE POLICY challenge_recommendations_delete ON public.challenge_recommendations FOR DELETE USING (
  has_role('admin')
);

-- Trigger to update last_updated timestamp for task_progress
CREATE OR REPLACE FUNCTION update_task_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_progress_update_trigger
BEFORE UPDATE ON public.task_progress
FOR EACH ROW EXECUTE FUNCTION update_task_progress_timestamp();