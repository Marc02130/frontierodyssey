import { createClient } from '@/utils/supabase/server';

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome {user?.email}</h1>
    </div>
  );
}