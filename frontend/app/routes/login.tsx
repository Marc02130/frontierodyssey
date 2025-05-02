import { Form, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { signIn, signInWithGoogle, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Handle email confirmation
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const code = new URLSearchParams(location.search).get('code');
      if (code) {
        try {
          // Get the current session to access user data
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session?.user) {
            console.error('No session or user:', { sessionError });
            setError('Failed to confirm email. Please try again.');
            return;
          }

          // Create user_info record
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
            setError('Failed to create user profile. Please contact support.');
            return;
          }

          // Navigate to dashboard on success
          navigate('/dashboard');
        } catch (error) {
          console.error('Error in email confirmation:', error);
          setError('Failed to confirm email. Please try again.');
        }
      }
    };

    handleEmailConfirmation();
  }, [location.search, navigate]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !location.search) { // Don't redirect if we have a confirmation code
      navigate('/dashboard');
    }
  }, [user, navigate, location.search]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signIn(email, password);
      // Navigation will happen automatically via the useEffect when user state updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
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
        <Form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
        </Form>

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
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 