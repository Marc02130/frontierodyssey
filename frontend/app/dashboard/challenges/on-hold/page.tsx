import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ChallengeList from '@/app/components/ChallengeList';

export default async function OnHoldChallenges() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: onHold } = await supabase
    .from('task_progress')
    .select('challenge_id, challenges(title)')
    .eq('user_id', user.id)
    .eq('is_completed', false)
    .lt('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">On Hold Challenges</h1>
      <ChallengeList challenges={onHold || []} />
    </div>
  );
}