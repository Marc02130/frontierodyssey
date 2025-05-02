import { useAuth } from '../../context/auth';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STATIC_QUESTIONS = [
  { sender: 'ai', text: "Hi! 😊 I'm your mentor. What's a subject or hobby you love?" },
  { sender: 'ai', text: "What grade are you in—9th, 10th, 11th, or 12th?" },
  { sender: 'ai', text: "How comfortable are you with Math? 1–5, 5 is super confident!" },
  { sender: 'ai', text: "How about Science? 1–5? 🚀" },
  { sender: 'ai', text: "And English? 1–5? 😊" },
];

function MessageBubble({ sender, text }: { sender: 'ai' | 'student', text: string }) {
  const isAI = sender === 'ai';
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-xs break-words shadow-sm text-base ${
          isAI
            ? 'bg-blue-100 text-blue-900'
            : 'bg-gray-200 text-gray-900'
        }`}
        aria-label={isAI ? 'AI message' : 'Your message'}
      >
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75" />
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150" />
      <span className="text-blue-400 ml-2">Mentor is typing...</span>
    </div>
  );
}

export default function DashboardOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    STATIC_QUESTIONS[0],
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => {
    // Redirect to review_onboarding when all questions are answered
    if (step >= STATIC_QUESTIONS.length) {
      navigate('/dashboard/review_onboarding', { state: { messages } });
    }
    // eslint-disable-next-line
  }, [step]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMessages = [
      ...messages,
      { sender: 'student', text: input },
    ];
    setMessages(newMessages);
    setInput('');
    if (step < STATIC_QUESTIONS.length - 1) {
      setTyping(true);
      setTimeout(() => {
        setMessages([...newMessages, STATIC_QUESTIONS[step + 1]]);
        setStep(step + 1);
        setTyping(false);
      }, 900);
    } else {
      setStep(step + 1); // triggers redirect
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-4 flex flex-col" style={{ minHeight: 400 }}>
        <div className="mb-2 text-sm text-gray-500">Onboarding Chat</div>
        <div className="flex-1 overflow-y-auto mb-2" ref={chatRef} style={{ maxHeight: 300 }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} sender={msg.sender as 'ai' | 'student'} text={msg.text} />
          ))}
          {typing && <TypingIndicator />}
        </div>
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all"
              style={{ width: `${((step + 1) / STATIC_QUESTIONS.length) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {step + 1}/{STATIC_QUESTIONS.length} questions answered
          </div>
        </div>
        <form onSubmit={handleSend} className="flex gap-2 mt-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            placeholder="Type your answer..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={typing || step >= STATIC_QUESTIONS.length}
            aria-label="Your answer"
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={typing || step >= STATIC_QUESTIONS.length || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}