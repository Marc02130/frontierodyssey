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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        {!onboarded ? null : <Sidebar />}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}