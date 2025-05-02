import { useLocation } from 'react-router-dom';

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a confirmation email to{' '}
            <span className="font-medium text-indigo-600">{email}</span>
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Click the link in the email to verify your account and complete the signup process.
          </p>
        </div>
      </div>
    </div>
  );
} 