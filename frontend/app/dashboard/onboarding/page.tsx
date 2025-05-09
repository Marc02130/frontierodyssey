"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { createClient } from '@/utils/supabase/client';

const supabaseClient = createClient();

const API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/onboarding`;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Message = { sender: 'ai' | 'student'; text: string };

function sanitizeInput(input: string) {
  return input.replace(/[^\w\s.,!?'-]/g, '').trim();
}

export default function Onboarding() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const hasFetchedInitial = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => {
    const fetchInitialMessage = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const user = session?.user;
      if (!user?.id || hasFetchedInitial.current) return;

      hasFetchedInitial.current = true;
      fetchAIMessage({ user_id: user.id });
    };

    fetchInitialMessage();
  }, []);

  useEffect(() => {
    if (isComplete) {
      router.push('/dashboard/review_onboarding', { state: { messages } });
    }
  }, [isComplete, router]);

  async function fetchAIMessage(payload: { user_id: string; response?: string }, retry = 0) {
    setError(null);
    try {
      const res = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const { message, is_complete } = res.data;

      setMessages(prev => {
        if (prev.some(msg => msg.sender === 'ai' && msg.text === message)) {
          return prev;
        }
        const newMessages = [...prev, { sender: 'ai', text: message }];
        setQuestionCount(newMessages.filter(msg => msg.sender === 'ai').length);
        return newMessages;
      });

      setIsComplete(is_complete);
    } catch (err) {
      if (retry >= 3) {
        setError('Something went wrong. Please try again or type another answer.');
      }
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || typing || isComplete) return;
    setTyping(true);
    const sanitized = sanitizeInput(input);
    setMessages(prev => {
      const newMessages = [...prev, { sender: 'student', text: sanitized }];
      setQuestionCount(newMessages.filter(msg => msg.sender === 'ai').length);
      if (questionCount >= 7) {
        setIsComplete(true);
      }
      return newMessages;
    });
    setInput('');
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      await fetchAIMessage({ user_id: session?.user.id!, response: sanitized });
    } finally {
      setTyping(false);
    }
  };

  const progress = Math.min((questionCount / 7) * 100, 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-4 flex flex-col" style={{ minHeight: 400 }}>
        <div className="mb-2 text-sm text-gray-500">Onboarding Chat</div>
        <div className="flex-1 overflow-y-auto mb-2" ref={chatRef} style={{ maxHeight: 300 }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} sender={msg.sender} text={msg.text} />
          ))}
          {typing && <TypingIndicator />}
        </div>
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {questionCount}/7 questions answered
          </div>
        </div>
        <form onSubmit={handleSend} className="flex gap-2 mt-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            placeholder="Type your answer..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={typing || isComplete}
            aria-label="Your answer"
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={typing || isComplete || !input.trim()}
          >
            Send
          </button>
        </form>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
}

function MessageBubble({ sender, text }: { sender: 'ai' | 'student'; text: string }) {
  const isAI = sender === 'ai';
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-xs break-words shadow-sm text-base ${
          isAI ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-900'
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