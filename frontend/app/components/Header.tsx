"use client";

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type HeaderProps = {};

const supabaseClient = createClient();

export default function Header({}: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabaseClient.auth.signOut({ scope: 'local' });
    if (!error) {
      router.push('/');
    } else {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="w-full flex items-center justify-between py-4 px-6 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-indigo-400 drop-shadow-lg tracking-tight select-none">
          FrontierOdyssey
        </span>
        <span className="text-2xl ml-2">🌌</span>
      </div>
      <button
        onClick={handleSignOut}
        className="ml-auto bg-white/20 hover:bg-white/40 text-white font-semibold px-4 py-2 rounded transition-colors shadow"
      >
        Sign Out
      </button>
    </header>
  );
}