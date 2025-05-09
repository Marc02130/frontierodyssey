import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ChallengeList from '@/app/components/ChallengeList';

export default async function CompletedChallenges() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: completed } = await supabase
    .from('mastery_logs')
    .select('challenge_id, challenges(title)')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Completed Challenges</h1>
      <ChallengeList challenges={completed || []} />
    </div>
  );
}