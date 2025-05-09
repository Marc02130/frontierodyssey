"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { user }, error: userError } = await createClient().auth.getUser();
        if (userError || !user) {
          router.push('/login?error=no_user');
          return;
        }

        const { error: userInfoError } = await createClient()
          .from('user_info')
          .insert([
            {
              id: user.id,
              email: user.email || '',
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (userInfoError && userInfoError.code !== '23505') {
          router.push('/login?error=user_info_failed');
          return;
        }

        router.push('/dashboard');
      } catch (error) {
        router.push('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Completing sign in...</h1>
        <p className="mt-2 text-gray-600">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  );
}