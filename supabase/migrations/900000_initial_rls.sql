-- RLS Policies
-- Enable RLS for all tables
ALTER TABLE public.user_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_elo_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- user_info: Students can view/update their own profile; admins can view all
CREATE POLICY user_info_select ON public.user_info
  FOR SELECT
  USING (auth.uid() = id OR has_role('admin'));
CREATE POLICY user_info_update ON public.user_info
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY user_info_insert ON public.user_info
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- student_conversations: Students can view/insert their own conversations
CREATE POLICY conversation_select ON public.student_conversations
  FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY conversation_insert ON public.student_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- student_elo_ratings: Students can view their own ratings
CREATE POLICY elo_select ON public.student_elo_ratings
  FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY elo_insert ON public.student_elo_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- challenges: All authenticated users can view; admins can insert/update
CREATE POLICY challenge_select ON public.challenges
  FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY challenge_insert ON public.challenges
  FOR INSERT
  WITH CHECK (has_role('admin'));
CREATE POLICY challenge_update ON public.challenges
  FOR UPDATE
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

-- mastery_logs: Students can view/insert their own logs
CREATE POLICY mastery_select ON public.mastery_logs
  FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY mastery_insert ON public.mastery_logs
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- interactions: Students can view/insert their own interactions
CREATE POLICY interaction_select ON public.interactions
  FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY interaction_insert ON public.interactions
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);
