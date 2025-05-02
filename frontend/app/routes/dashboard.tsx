import { Outlet } from 'react-router';
import { useAuth } from '../context/auth';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchOnboarded() {
      if (user) {
        const { data } = await supabase
          .from('user_info')
          .select('onboarded')
          .eq('id', user.id)
          .single();
        setOnboarded(data?.onboarded ?? false);
      }
    }
    fetchOnboarded();
  }, [user]);

  if (onboarded === null) {
    return <div>Loading...</div>;
  }

  // If user is not onboarded, show onboarding as the only child route
  if (onboarded === false) {
    return (
      <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header signOut={signOut} />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 p-8 overflow-y-auto">
            <Outlet context={{ onboarding: true }} />
          </main>
        </div>
      </div>
    </ProtectedRoute>
    );
  }

  // Otherwise, render dashboard layout and nested content
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header signOut={signOut} />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto">
            <Outlet context={{ onboarding: false }} />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 