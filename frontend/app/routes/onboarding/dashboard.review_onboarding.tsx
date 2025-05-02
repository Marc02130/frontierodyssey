import { useAuth } from '../../context/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function DashboardReviewOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Get messages from navigation state (fallback to empty array)
  const messages = (location.state?.messages ?? []) as Array<{ sender: string; text: string }>;

  // Extract user responses (odd indices)
  const userResponses = messages.filter((msg, i) => msg.sender === 'student');
  const [responses, setResponses] = useState(userResponses.map(r => r.text));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleChange = (i: number, value: string) => {
    setResponses(responses => responses.map((r, idx) => (idx === i ? value : r)));
  };

  const handleAccept = () => {
    // TODO: Save responses/profile if needed
    navigate('/dashboard');
  };

  const handleRestart = () => {
    navigate('/dashboard/onboarding');
  };

  let responseIdx = 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-4 flex flex-col gap-4" style={{ minHeight: 400, maxHeight: 600 }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Your Onboarding</h2>
        <div className="flex-1 overflow-y-auto space-y-4" style={{ minHeight: 200, maxHeight: 350 }}>
          {messages.map((msg, i) =>
            msg.sender === 'ai' ? (
              <div key={i} className="text-blue-700 bg-blue-50 rounded px-3 py-2 w-fit max-w-full">
                {msg.text}
              </div>
            ) : (
              <div key={i} className="flex items-center gap-2">
                <span className="text-gray-700">Your answer:</span>
                <input
                  className="border border-gray-300 rounded px-2 py-1 flex-1"
                  value={responses[responseIdx] ?? ''}
                  onChange={e => handleChange(responseIdx, e.target.value)}
                  aria-label="Edit your answer"
                />
                {++responseIdx && null}
              </div>
            )
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-4 mt-4 sticky bottom-0 bg-white pt-4 z-10">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleAccept}
          >
            Accept
          </button>
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            onClick={handleRestart}
          >
            Restart
          </button>
        </div>
      </div>
    </div>
  );
}