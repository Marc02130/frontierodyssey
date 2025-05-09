import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Welcome to Frontier Odyssey</h1>
      <p className="mb-8">Sign in to get started.</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}