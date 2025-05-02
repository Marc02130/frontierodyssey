import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';

export default function Onboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        async function checkOnboarded() {
            if (user) {
                const { data, error } = await supabase
                    .from('user_info')
                    .select('onboarded')
                    .eq('id', user.id)
                    .single();
                if (data && data.onboarded) {
                    navigate('/dashboard');
                }
            }
        }
        checkOnboarded();
    }, [user, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Onboarding</h1>
            <p className="mt-2 text-gray-600">Welcome! Start your onboarding process here.</p>
        </div>
        </div>
    );
}