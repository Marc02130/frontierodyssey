-- initial challenges for MVP
INSERT INTO public.challenges (subject, theme, elo_rating, tasks, exploration, estimated_time)
VALUES
  ('Science', 'Sustainability', 1000, '{"task1": {"type": "calculate", "prompt": "Optimize microgrid output"}}', '{"image": "village.jpg", "prompt": "Analyze terrain"}', 18),
  ('Science', 'Innovation', 1100, '{"task1": {"type": "design", "prompt": "Plan wind turbine"}}', '{"image": "windmill.jpg", "prompt": "Study wind patterns"}', 16),
  ('Math', 'Global Systems', 900, '{"task1": {"type": "optimize", "prompt": "Route logistics"}}', '{"image": "market.jpg", "prompt": "Analyze trade routes"}', 15),
  ('Math', 'Sustainability', 1000, '{"task1": {"type": "model", "prompt": "Energy costs"}}', '{"image": "solar.jpg", "prompt": "Evaluate solar potential"}', 17),
  ('English', 'Global Systems', 950, '{"task1": {"type": "analyze", "prompt": "Speech rhetoric"}}', '{"image": "archive.jpg", "prompt": "Explore historical context"}', 16);

-- Optional: Seed test user (requires auth.users entry first)
-- INSERT INTO public.user_info (id, email, grade)
-- VALUES ('uuid-from-auth-users', 'test@student.com', 10);