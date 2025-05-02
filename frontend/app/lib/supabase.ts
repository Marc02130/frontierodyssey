import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Only use test storage in test environment, otherwise use browser storage
const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
export const testStorage = new Map();

const storageAdapter = isTest ? {
  getItem: (key: string): string | null => testStorage.get(key) || null,
  setItem: (key: string, value: string): void => { testStorage.set(key, value); },
  removeItem: (key: string): void => { testStorage.delete(key); },
} : undefined;

console.log('Supabase client storage adapter:', isTest ? 'testStorage' : 'browser storage');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    storage: storageAdapter,
    detectSessionInUrl: true,
  },
}); 