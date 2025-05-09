'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-indigo-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">FrontierOdyssey</h1>
      <nav className="flex gap-4">
        <Link
          href="/dashboard/profile"
          className={`px-4 py-2 rounded hover:bg-indigo-700 ${pathname === '/dashboard/profile' ? 'bg-indigo-700' : ''}`}
          aria-label="Navigate to Profile"
        >
          Profile 👤
        </Link>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded hover:bg-red-600 bg-red-500"
          aria-label="Sign Out"
        >
          Sign Out 🚪
        </button>
      </nav>
    </header>
  );
}