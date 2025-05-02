import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Custom storage adapter for tests
const isTest = process.env.NODE_ENV === 'test';
export const testStorage = new Map<string, string>();

const storageAdapter = isTest ? {
  getItem: (key: string) => {
    return testStorage.get(key) || null;
  },
  setItem: (key: string, value: string) => {
    testStorage.set(key, value);
  },
  removeItem: (key: string) => {
    testStorage.delete(key);
  },
} : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    storage: storageAdapter,
    detectSessionInUrl: true,
  },
}); 