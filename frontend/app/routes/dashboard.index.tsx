import { useAuth } from '../context/auth';

export default function DashboardHome() {
  const { user, signOut } = useAuth();
  return (
    <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome {user?.email}</h1>
      <button
        onClick={() => signOut()}
        className="mt-8 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
      >
        Sign Out
      </button>
    </div>
  );
} 