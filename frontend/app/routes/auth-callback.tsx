import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const createUserInfo = async (userId: string, email: string) => {
      const { error } = await supabase
        .from('user_info')
        .insert([
          { 
            id: userId,
            email: email,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error && error.code !== '23505') { // Ignore unique constraint violations
        console.error('Error creating user_info:', error);
      }
    };

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Create user_info record for OAuth users
        try {
          await createUserInfo(session.user.id, session.user.email || '');
        } catch (error) {
          console.error('Error in auth callback:', error);
        }
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Completing sign in...</h1>
      </div>
    </div>
  );
} 