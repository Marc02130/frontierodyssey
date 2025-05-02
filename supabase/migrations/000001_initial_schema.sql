-- FrontierOdyssey Database Schema for Supabase
-- Created for MVP with Supabase Auth (auth.users)
-- Includes tables, indices, and RLS policies

-- Enable UUID extension for auth.users compatibility
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- user_info: Stores student profiles, linked to auth.users
CREATE TABLE public.user_info (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  current_grade INT CHECK (grade BETWEEN 9 AND 12),
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- student_conversations: Stores conversational data (e.g., interests) for AI parsing
CREATE TABLE public.student_conversations (
  conversation_id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.user_info(id) ON DELETE CASCADE,
  conversation_type VARCHAR(50) NOT NULL, -- E.g., 'interests', 'reflection'
  conversation TEXT NOT NULL CHECK (LENGTH(conversation) <= 500), -- Limit for MVP
  conversation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', conversation)) STORED
);

-- student_elo_ratings: Tracks ELO rating history
CREATE TABLE public.student_elo_ratings (
  elo_id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.user_info(id) ON DELETE CASCADE,
  grade INT CHECK (grade BETWEEN 9 AND 12),
  rating INT NOT NULL CHECK (rating >= 0), -- E.g., 800–2000
  rating_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_student_date UNIQUE (student_id, rating_date)
);

-- challenges: Stores challenge metadata
CREATE TABLE public.challenges (
  challenge_id SERIAL PRIMARY KEY,
  subject VARCHAR(50) NOT NULL, -- E.g., 'Science', 'Math', 'English'
  theme VARCHAR(50) NOT NULL, -- E.g., 'Sustainability', 'Global Systems'
  elo_rating INT NOT NULL CHECK (elo_rating >= 0), -- E.g., 800–2000
  tasks JSONB NOT NULL, -- E.g., { "task1": { "type": "calculate", "prompt": "Optimize panel output" } }
  exploration JSONB NOT NULL, -- E.g., { "image": "village.jpg", "prompt": "Analyze terrain" }
  estimated_time INT NOT NULL CHECK (estimated_time BETWEEN 15 AND 20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- mastery_logs: Tracks skill mastery per challenge
CREATE TABLE public.mastery_logs (
  student_id UUID REFERENCES public.user_info(id) ON DELETE CASCADE,
  challenge_id INT REFERENCES public.challenges(challenge_id) ON DELETE CASCADE,
  skill_id INT, -- E.g., 'Algebra' (optional, can be expanded post-MVP)
  mastery_level DECIMAL(5,2) CHECK (mastery_level BETWEEN 0 AND 100), -- E.g., 85.50
  completed_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (student_id, challenge_id)
);

-- interactions: Logs student responses and AI feedback
CREATE TABLE public.interactions (
  interaction_id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.user_info(id) ON DELETE CASCADE,
  challenge_id INT REFERENCES public.challenges(challenge_id) ON DELETE CASCADE,
  response JSONB NOT NULL, -- E.g., { "answer": "Battery backup", "feedback": "Consider cost" }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX idx_conversation_student_type ON public.student_conversations(student_id, conversation_type);
CREATE INDEX idx_conversation_search ON public.student_conversations USING GIN(search_vector);
CREATE INDEX idx_elo_student_date ON public.student_elo_ratings(student_id, rating_date DESC);
CREATE INDEX idx_challenges_elo ON public.challenges(elo_rating);
CREATE INDEX idx_mastery_logs_completed ON public.mastery_logs(completed_at);
CREATE INDEX idx_interactions_student_challenge ON public.interactions(student_id, challenge_id);

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION has_role(role_name text)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = role_name
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
