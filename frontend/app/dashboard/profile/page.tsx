// frontend/app/dashboard/profile/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userInfo } = await supabase.from('user_info').select('grade_level, interests, subject_comfort').eq('id', user.id).single();
  const { data: profile } = await supabase.from('user_profile').select('profile_summary').eq('user_id', user.id).single();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Your Profile</h1>
      <p>Grade: {userInfo?.grade_level || 'Not set'}</p>
      <p>Interests: {userInfo?.interests?.join(', ') || 'None'}</p>
      <p>Subject Comfort: {JSON.stringify(userInfo?.subject_comfort) || 'Not set'}</p>
      <p>Summary: {profile?.profile_summary || 'No summary'}</p>
    </div>
  );
}