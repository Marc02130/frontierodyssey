import { useAuth } from '../context/auth';
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
              <h1 className="text-2xl font-semibold text-gray-900">Welcome {user?.email}</h1>
              <button
                onClick={() => signOut()}
                className="mt-8 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 