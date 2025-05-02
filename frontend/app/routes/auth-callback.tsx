import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Let Supabase handle the code exchange since it manages the code verifier
        const { error: signInError } = await supabase.auth.getSession();
        if (signInError) {
          console.error('Failed to get session:', signInError);
          navigate('/login?error=exchange_failed');
          return;
        }

        // Get the current session to access user data
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          console.error('No session or user:', { sessionError });
          navigate('/login?error=no_user');
          return;
        }

        console.log('Creating user_info record');
        const { error: userInfoError } = await supabase
          .from('user_info')
          .insert([
            { 
              id: session.user.id,
              email: session.user.email || '',
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();
        
        if (userInfoError && userInfoError.code !== '23505') { // Ignore unique constraint violations
          console.error('Error creating user_info:', userInfoError);
          navigate('/login?error=user_info_failed');
          return;
        }

        console.log('Successfully completed auth callback');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Completing sign in...</h1>
        <p className="mt-2 text-gray-600">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  );
} 