import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ChallengeList from '@/app/components/ChallengeList';

export default async function ActiveChallenges() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: active } = await supabase
    .from('task_progress')
    .select('challenge_id, challenges(title)')
    .eq('user_id', user.id)
    .eq('is_completed', false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Active Challenges</h1>
      <ChallengeList challenges={active || []} />
    </div>
  );
}