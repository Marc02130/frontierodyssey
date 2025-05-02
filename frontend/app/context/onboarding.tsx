import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';

export interface OnboardingProfileData {
  grade_level?: string;
  interests?: string[];
  subject_comfort?: Record<string, number>;
  onboarded?: boolean;
  [key: string]: any;
}

export async function saveOnboardingProfile(profileData: OnboardingProfileData) {
  const { user } = useAuth();
  if (!user) throw new Error('User not authenticated');
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      ...profileData,
    });
  if (error) throw error;
} 