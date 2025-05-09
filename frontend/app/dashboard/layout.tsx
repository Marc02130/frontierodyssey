import { createClient } from '@/utils/supabase/server';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    console.log('No user found in session');
    return <div>Unauthorized</div>;
  }

  const { data: userInfo, error: userInfoError } = await supabase
    .from('user_info')
    .select('onboarded')
    .eq('id', user.id)
    .single();

  if (userInfoError) {
    console.log('userInfoError:', userInfoError);
  }

  const onboarded = userInfo?.onboarded ?? false;

  // Fetch challenge counts for Sidebar
  const { count: active } = await supabase
    .from('task_progress')
    .select('challenge_id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_completed', false);
  const { count: recommended } = await supabase
    .from('challenge_recommendations')
    .select('challenge_id', { count: 'exact' })
    .eq('user_id', user.id);
  const { count: completed } = await supabase
    .from('mastery_logs')
    .select('challenge_id', { count: 'exact' })
    .eq('user_id', user.id)
    .not('completed_at', 'is', null);
  const { count: onHold } = await supabase
    .from('task_progress')
    .select('challenge_id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_completed', false)
    .lt('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        {!onboarded ? null : <Sidebar counts={{ active: active || 0, recommended: recommended || 0, completed: completed || 0, onHold: onHold || 0 }} />}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}