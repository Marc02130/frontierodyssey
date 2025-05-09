-- Drop the existing policy
DROP POLICY messages_select ON public.messages;

-- Create a new policy
CREATE POLICY messages_select ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.conversation_id = messages.conversation_id
    AND c.user_id = auth.uid()
  ) OR has_role('admin')
);