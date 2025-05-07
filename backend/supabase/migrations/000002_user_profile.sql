-- user_profile: Stores user profile summary
CREATE TABLE public.user_profile (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, 
  profile_summary TEXT NOT NULL,
  is_draft BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profile_is_draft ON public.user_profile(is_draft);