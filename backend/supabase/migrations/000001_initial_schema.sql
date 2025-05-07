-- FrontierOdyssey Database Schema for Supabase
-- Created for MVP with Supabase Auth (auth.users)
-- Includes tables, indices, RLS policies, and triggers
-- Revised to align with onboarding requirements (artifact ID 0a401275-4900-4e1a-96ca-569a8535bc2e)
-- Removed interactions table, merged into messages with challenge_interaction
-- Replaced ai_generated and nullable user_id with sender_type enum

-- Enable UUID extension for auth.users compatibility
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- user_info: Stores student profiles, linked to auth.users
CREATE TABLE public.user_info (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  grade_level VARCHAR(10) CHECK (grade_level IN ('9th', '10th', '11th', '12th') OR grade_level IS NULL), -- Nullable for drafts
  interests TEXT[], -- Nullable for drafts
  subject_comfort JSONB, -- Nullable for drafts, e.g., {"math": 3}
  onboarded BOOLEAN DEFAULT FALSE,
  language VARCHAR(2) DEFAULT 'en', -- For internationalization (en, es)
  birth_year INT CHECK (birth_year BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE)), -- For parental consent
  parental_consent BOOLEAN DEFAULT FALSE, -- For FERPA/COPPA under 16
  user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('student', 'educator', 'parent')), -- For future extensibility
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  educator_access UUID[] DEFAULT '{}', -- For future extensibility
  parent_access UUID[] DEFAULT '{}'
);

-- challenges: Stores challenge metadata
CREATE TABLE public.challenges (
  challenge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject VARCHAR(50) NOT NULL, -- E.g., 'Science', 'Math', 'English'
  theme VARCHAR(50) NOT NULL, -- E.g., 'Sustainability', 'Global Systems'
  elo_rating INT NOT NULL CHECK (elo_rating >= 0), -- E.g., 800–2000
  tasks JSONB NOT NULL, -- E.g., { "task1": { "type": "calculate", "prompt": "Optimize panel output" } }
  exploration JSONB NOT NULL, -- E.g., { "image": "village.jpg", "prompt": "Analyze terrain" }
  estimated_time INT NOT NULL CHECK (estimated_time BETWEEN 15 AND 20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- conversations: Groups messages into conversation threads
CREATE TABLE public.conversations (
  conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, 
  challenge_id UUID REFERENCES public.challenges(challenge_id) ON DELETE CASCADE, -- NULL for onboarding, required for challenges
  topic_type VARCHAR(50) NOT NULL CHECK (
    (topic_type = 'onboard' AND challenge_id IS NULL) OR
    (topic_type = 'challenge' AND challenge_id IS NOT NULL)
  ), -- Enforce onboarding vs. challenge
  conversation_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- messages: Stores individual messages for AI parsing, including challenge interactions
CREATE TABLE public.messages (
  message_id SERIAL PRIMARY KEY, -- SERIAL for storage efficiency
  conversation_id UUID NOT NULL REFERENCES public.conversations(conversation_id) ON DELETE CASCADE, -- NOT NULL
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- NOT NULL, user_id for all messages
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('student', 'parent', 'teacher','ai')), -- Replaced ai_generated, indicates student or AI
  message_type VARCHAR(50) NOT NULL CHECK (
    message_type IN ('onboard_interests', 'onboard_grade', 'onboard_comfort', 'profile_edit', 'reflection', 'challenge_question', 'challenge_response', 'challenge_interaction')
  ), -- Added profile_edit for edit logs
  topic VARCHAR(50) NOT NULL,
  message TEXT NOT NULL CHECK (LENGTH(message) <= 250 AND LENGTH(TRIM(message)) > 0), -- 250 chars, non-empty
  is_draft BOOLEAN DEFAULT FALSE, -- For partial progress
  message_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', message)) STORED
  -- Partition by message_date post-MVP if storage > 250 MB/year
);

-- feedback: Stores onboarding and post-launch feedback
CREATE TABLE public.feedback (
  feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating BOOLEAN NOT NULL, -- true for thumbs up, false for thumbs down
  is_mid_session BOOLEAN NOT NULL DEFAULT FALSE,
  context VARCHAR(50) NOT NULL CHECK (context IN ('onboarding', 'survey')), -- For post-launch surveys
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- elo_ratings: Tracks ELO rating history
CREATE TABLE public.elo_ratings (
  elo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL CHECK (subject IN ('Math', 'Science', 'English')),
  rating INT NOT NULL CHECK (rating >= 0), -- E.g., 800–2000
  rating_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_student_subject_date UNIQUE (user_id, subject, rating_date)
);

-- mastery_logs: Tracks skill mastery per challenge
CREATE TABLE public.mastery_logs (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(challenge_id) ON DELETE CASCADE,
  skill_id INT, -- E.g., 'Algebra' (optional, can be expanded post-MVP)
  mastery_level DECIMAL(5,2) CHECK (mastery_level BETWEEN 0 AND 100), -- E.g., 85.50
  completed_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (user_id, challenge_id)
);

-- Indices for performance
CREATE INDEX idx_messages_user_type ON public.messages(user_id, message_type);
CREATE INDEX idx_messages_search ON public.messages USING GIN(search_vector);
CREATE INDEX idx_elo_user_date ON public.elo_ratings(user_id, rating_date DESC);
CREATE INDEX idx_feedback_user ON public.feedback(user_id, created_at DESC);
CREATE INDEX idx_challenges_elo ON public.challenges(elo_rating);
CREATE INDEX idx_mastery_logs_completed ON public.mastery_logs(completed_at);

-- RLS Policies
-- Enable RLS for all tables
ALTER TABLE public.user_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_logs ENABLE ROW LEVEL SECURITY;

-- user_info: Students can view/update/insert their own profile; admins can view all
CREATE POLICY user_info_select ON public.user_info FOR SELECT USING (auth.uid() = id OR has_role('admin'));
CREATE POLICY user_info_update ON public.user_info FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY user_info_insert ON public.user_info FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY user_info_user_type ON public.user_info FOR UPDATE USING (
  has_role('admin') OR
  (auth.uid() = id AND user_type = 'student')
) WITH CHECK (
  has_role('admin') OR
  (auth.uid() = id AND user_type = 'student')
); -- Restrict user_type changes
CREATE POLICY user_info_parental_consent ON public.user_info FOR ALL USING (
  EXTRACT(YEAR FROM CURRENT_DATE) - birth_year < 16 AND parental_consent = true OR
  EXTRACT(YEAR FROM CURRENT_DATE) - birth_year >= 16 OR
  birth_year IS NULL
); -- Enforce for under 16, allow NULL birth_year

-- conversations: Users with messages in thread; admins can view/insert/update
CREATE POLICY conversations_select ON public.conversations FOR SELECT USING (user_id = auth.uid() OR has_role('admin'));
CREATE POLICY conversations_insert ON public.conversations FOR INSERT WITH CHECK (user_id = auth.uid() OR has_role('admin'));
CREATE POLICY conversations_update ON public.conversations FOR UPDATE USING (has_role('admin')) WITH CHECK (has_role('admin'));

-- messages: Students can view own threads; admins can view/insert/update/delete
CREATE POLICY messages_select ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m2
    WHERE m2.conversation_id = messages.conversation_id
    AND m2.user_id = auth.uid()
  ) OR has_role('admin')
);
CREATE POLICY messages_insert ON public.messages FOR INSERT WITH CHECK (user_id = auth.uid() OR has_role('admin'));
CREATE POLICY messages_update ON public.messages FOR UPDATE USING (has_role('admin')) WITH CHECK (has_role('admin'));
CREATE POLICY messages_delete ON public.messages FOR DELETE USING (has_role('admin')); -- For erroneous AI messages

-- feedback: Restrict to own data; admins can view/insert/update
CREATE POLICY feedback_select ON public.feedback FOR SELECT USING (user_id = auth.uid() OR has_role('admin'));
CREATE POLICY feedback_insert ON public.feedback FOR INSERT WITH CHECK (user_id = auth.uid() OR has_role('admin'));
CREATE POLICY feedback_update ON public.feedback FOR UPDATE USING (has_role('admin')) WITH CHECK (has_role('admin'));

-- elo_ratings: Restrict to own data; admins can view/insert/update
CREATE POLICY elo_select ON public.elo_ratings FOR SELECT USING (user_id = auth.uid() OR has_role('admin'));
CREATE POLICY elo_insert ON public.elo_ratings FOR INSERT WITH CHECK (user_id = auth.uid() OR has_role('admin'));
CREATE POLICY elo_update ON public.elo_ratings FOR UPDATE USING (has_role('admin')) WITH CHECK (has_role('admin'));

-- challenges: All authenticated users can view; admins can insert/update
CREATE POLICY challenge_select ON public.challenges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY challenge_insert ON public.challenges FOR INSERT WITH CHECK (has_role('admin'));
CREATE POLICY challenge_update ON public.challenges FOR UPDATE USING (has_role('admin')) WITH CHECK (has_role('admin'));

-- mastery_logs: Students can view/insert own logs; admins can view/insert/update
CREATE POLICY mastery_select ON public.mastery_logs FOR SELECT USING (user_id = auth.uid() OR has_role('admin'));
CREATE POLICY mastery_insert ON public.mastery_logs FOR INSERT WITH CHECK (user_id = auth.uid() OR has_role('admin'));
CREATE POLICY mastery_update ON public.mastery_logs FOR UPDATE USING (has_role('admin')) WITH CHECK (has_role('admin'));

-- Trigger for tsvector updates (optimized for onboard_interests)
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.message_type = 'onboard_interests' THEN
    NEW.search_vector := to_tsvector('english', NEW.message);
  ELSE
    NEW.search_vector := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_search_trigger
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION update_message_search_vector();

-- Function for scheduled data retention (2 years)
CREATE OR REPLACE FUNCTION delete_expired_data()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.messages
  WHERE message_date < CURRENT_TIMESTAMP - INTERVAL '2 years';
  DELETE FROM public.conversations
  WHERE conversation_start_date < CURRENT_TIMESTAMP - INTERVAL '2 years';
  DELETE FROM public.feedback
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Execute daily via Supabase Edge Function or cron job
-- Example: SELECT cron.schedule('delete_expired_data', '0 0 * * *', $$SELECT delete_expired_data()$$);

-- Stored procedure for restarting onboarding
CREATE OR REPLACE PROCEDURE clear_draft_profile(user_id_param UUID)
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.user_info
  WHERE id = user_id_param AND onboarded = false;
  DELETE FROM public.messages
  WHERE user_id = user_id_param AND is_draft = true;
  DELETE FROM public.feedback
  WHERE user_id = user_id_param AND context = 'onboarding';
  COMMIT;
END;
$$;

-- Stored procedure for user-initiated data deletion
CREATE OR REPLACE PROCEDURE delete_user_data(user_id_param UUID)
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.messages
  WHERE user_id = user_id_param;
  DELETE FROM public.conversations
  WHERE conversation_id IN (
    SELECT conversation_id FROM public.messages
    WHERE user_id = user_id_param
  );
  DELETE FROM public.feedback
  WHERE user_id = user_id_param;
  DELETE FROM public.elo_ratings
  WHERE user_id = user_id_param;
  DELETE FROM public.mastery_logs
  WHERE user_id = user_id_param;
  DELETE FROM public.user_info
  WHERE id = user_id_param;
  COMMIT;
END;
$$;

-- Helper function for admin role
CREATE OR REPLACE FUNCTION has_role(role_name text)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = role_name
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;