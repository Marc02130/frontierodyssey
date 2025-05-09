'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ counts }: { counts: { active: number; recommended: number; completed: number; onHold: number } }) {
  const pathname = usePathname();
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);

  return (
    <aside className="h-full w-16 md:w-64 bg-gradient-to-b from-indigo-50 to-indigo-100 border-r border-indigo-200 flex flex-col py-6 shadow-sm md:items-start items-center">
      <span className="text-2xl text-indigo-400 mb-6">🧭</span>
      <nav className="flex flex-col gap-2 w-full">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-200 rounded ${pathname === '/dashboard' ? 'bg-indigo-200' : ''}`}
          aria-label="Navigate to Home"
        >
          <span className="text-xl">🏠</span>
          <span className="hidden md:block">Home</span>
        </Link>
        <div>
          <button
            onClick={() => setIsChallengesOpen(!isChallengesOpen)}
            className={`flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-200 rounded w-full ${pathname.startsWith('/dashboard/challenges') ? 'bg-indigo-200' : ''}`}
            aria-expanded={isChallengesOpen}
            aria-label="Toggle Challenges menu"
          >
            <span className="text-xl">🚀</span>
            <span className="hidden md:block">Challenges</span>
            <span className="ml-auto hidden md:block">{isChallengesOpen ? '⬇️' : '➡️'}</span>
          </button>
          {isChallengesOpen && (
            <div className="ml-4 flex flex-col gap-1">
              <Link
                href="/dashboard/challenges/active"
                className={`flex items-center gap-2 px-4 py-1 text-indigo-600 hover:bg-indigo-200 rounded ${pathname === '/dashboard/challenges/active' ? 'bg-indigo-200' : ''}`}
                aria-label="Navigate to Active Challenges"
              >
                <span className="hidden md:block">Active ({counts.active})</span>
              </Link>
              <Link
                href="/dashboard/challenges/recommended"
                className={`flex items-center gap-2 px-4 py-1 text-indigo-600 hover:bg-indigo-200 rounded ${pathname === '/dashboard/challenges/recommended' ? 'bg-indigo-200' : ''}`}
                aria-label="Navigate to Recommended Challenges"
              >
                <span className="hidden md:block">Recommended ({counts.recommended})</span>
              </Link>
              <Link
                href="/dashboard/challenges/completed"
                className={`flex items-center gap-2 px-4 py-1 text-indigo-600 hover:bg-indigo-200 rounded ${pathname === '/dashboard/challenges/completed' ? 'bg-indigo-200' : ''}`}
                aria-label="Navigate to Completed Challenges"
              >
                <span className="hidden md:block">Completed ({counts.completed})</span>
              </Link>
              <Link
                href="/dashboard/challenges/on-hold"
                className={`flex items-center gap-2 px-4 py-1 text-indigo-600 hover:bg-indigo-200 rounded ${pathname === '/dashboard/challenges/on-hold' ? 'bg-indigo-200' : ''}`}
                aria-label="Navigate to On Hold Challenges"
              >
                <span className="hidden md:block">On Hold ({counts.onHold})</span>
              </Link>
            </div>
          )}
        </div>
        <Link
          href="/dashboard/search"
          className="flex items-center gap-2 px-4 py-2 text-indigo-600 opacity-50 cursor-not-allowed"
          aria-disabled="true"
          title="Search challenges (coming soon)"
        >
          <span className="text-xl">🔍</span>
          <span className="hidden md:block">Search</span>
        </Link>
        <Link
          href="/dashboard/feedback"
          className="flex items-center gap-2 px-4 py-2 text-indigo-600 opacity-50 cursor-not-allowed"
          aria-disabled="true"
          title="Share feedback (coming soon)"
        >
          <span className="text-xl">💬</span>
          <span className="hidden md:block">Feedback</span>
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 px-4 py-2 text-indigo-600 opacity-50 cursor-not-allowed"
          aria-disabled="true"
          title="Manage account (coming soon)"
        >
          <span className="text-xl">⚙️</span>
          <span className="hidden md:block">Settings</span>
        </Link>
        <Link
          href="/dashboard/help"
          className="flex items-center gap-2 px-4 py-2 text-indigo-600 opacity-50 cursor-not-allowed"
          aria-disabled="true"
          title="Get support (coming soon)"
        >
          <span className="text-xl">❓</span>
          <span className="hidden md:block">Help</span>
        </Link>
      </nav>
    </aside>
  );
}