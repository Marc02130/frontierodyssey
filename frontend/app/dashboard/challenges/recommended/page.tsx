import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ChallengeList from '@/app/components/ChallengeList';

export default async function RecommendedChallenges() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: recommended } = await supabase
    .from('challenge_recommendations')
    .select('challenge_id, challenges(title)')
    .eq('user_id', user.id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Recommended Challenges</h1>
      <ChallengeList challenges={recommended || []} />
    </div>
  );
}