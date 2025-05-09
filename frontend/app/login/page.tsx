"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

const supabaseClient = createClient();

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectFrom = searchParams.get('redirectedFrom') || '/dashboard';

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const code = searchParams.get('code');
      if (code) {
        try {
          const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
          console.log('Email Confirmation Session:', { session, sessionError });
          if (sessionError || !session?.user) {
            setError('Failed to confirm email. Please try again.');
            return;
          }

          const { error: userInfoError } = await supabaseClient
            .from('user_info')
            .insert([
              {
                id: session.user.id,
                email: session.user.email || '',
                user_type: 'student',
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (userInfoError && userInfoError.code !== '23505') {
            console.log('userInfoError:', userInfoError);
            setError('Failed to create user profile. Please contact support.');
            return;
          }

          const { data, error } = await supabaseClient
            .from('user_info')
            .select('onboarded')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.log('onboardedError:', error);
          }

          if (data && data.onboarded) {
            router.push('/dashboard');
          } else {
            router.push('/dashboard/onboarding');
          }
        } catch (error) {
          console.log('Email Confirmation Error:', error);
          setError('Failed to confirm email. Please try again.');
        }
      }
    };

    handleEmailConfirmation();
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      console.log('SignIn Response:', { data, error });
      if (error) throw error;

      const { data: userInfo, error: userInfoError } = await supabaseClient
        .from('user_info')
        .select('onboarded')
        .eq('id', data.user.id)
        .single();

      if (userInfoError) {
        console.log('userInfoError:', userInfoError);
        throw userInfoError;
      }

      if (userInfo && data.onboarded) {
        router.push('/dashboard');
      } else {
        router.push('/dashboard/onboarding');
      }
    } catch (err) {
      console.log('SignIn Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      console.log('Google SignIn Response:', { error });
      if (error) throw error;
    } catch (err) {
      console.log('Google SignIn Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/signup" className="text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}