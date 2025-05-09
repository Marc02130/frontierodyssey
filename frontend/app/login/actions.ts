'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

const handleEmailConfirmation = async () => {
    const code = searchParams.get('code');
    if (code) {
        try {
            const { data: { session }, error: sessionError } = await createClient().auth.getSession();
            const { data: { user } } = await createClient().auth.getUser();

            console.log('Email Confirmation Session:', { session, sessionError });
            if (sessionError || !user) {
            setError('Failed to confirm email. Please try again.');
            return;
            }

            const { error: userInfoError } = await createClient()
            .from('user_info')
            .insert([
                {
                id: user.id,
                email: user.email || '',
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

            const { data, error } = await createClient()
            .from('user_info')
            .select('onboarded')
            .eq('id', user.id)
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