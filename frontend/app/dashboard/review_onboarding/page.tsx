"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ReviewOnboarding() {
  const router = useRouter();
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { user } } = await createClient().auth.getUser();
      const userId = user?.id;

      if (!userId) return;

      const { data: convs, error: convErr } = await createClient()
        .from('conversations')
        .select('conversation_id')
        .eq('user_id', userId)
        .eq('topic_type', 'onboard')
        .limit(1);

      if (convErr || !convs?.length) {
        setError('No onboarding conversation found');
        return;
      }

      const conversationId = convs[0].conversation_id;

      const { data: msgData, error: msgErr } = await createClient()
        .from('messages')
        .select('sender_type, message')
        .eq('conversation_id', conversationId);

      if (msgErr) {
        setError('Failed to load messages');
        return;
      }

      const fetchedMessages = msgData.map(msg => ({
        sender: msg.sender_type === 'user' ? 'student' : 'ai',
        text: msg.message,
      }));

      setMessages(fetchedMessages);
      setResponses(fetchedMessages.filter(msg => msg.sender === 'student').map(msg => msg.text));
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleChange = (i: number, value: string) => {
    setResponses(responses => responses.map((r, idx) => (idx === i ? value : r)));
  };

  const handleAccept = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await createClient().auth.getUser();
      const userId = user?.id;

      const { data: convs, error: convErr } = await createClient()
        .from('conversations')
        .select('conversation_id')
        .eq('user_id', userId)
        .eq('topic_type', 'onboard')
        .limit(1);

      if (convErr || !convs?.length) throw new Error('No onboarding conversation found');

      const conversationId = convs[0].conversation_id;

      const { error: msgErr } = await createClient()
        .from('messages')
        .update({ message: responses })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'user');

      if (msgErr) throw msgErr;

      let grade_level = null,
        interests: string[] = [],
        subject_comfort: any = {};
      responses.forEach(r => {
        if (/9th|10th|11th|12th/.test(r)) grade_level = r.match(/9th|10th|11th|12th/)![0];
        if (/math/i.test(r)) interests.push('Math');
        if (/science/i.test(r)) interests.push('Science');
        if (/english/i.test(r)) interests.push('English');
        if (/([1-5])/.test(r)) {
          const val = parseInt(r.match(/([1-5])/g)![0]);
          if (/math/i.test(r)) subject_comfort.math = val;
          if (/science/i.test(r)) subject_comfort.science = val;
          if (/english/i.test(r)) subject_comfort.english = val;
        }
      });

      const { error: infoErr } = await createClient()
        .from('user_info')
        .update({
          grade_level,
          interests,
          subject_comfort,
          onboarded: true,
        })
        .eq('id', userId);

      if (infoErr) throw infoErr;

      router.push('/dashboard');
    } catch (err: any) {
      setError('Failed to save. Please try again!');
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = () => {
    router.push('/dashboard/onboarding');
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
                  disabled={saving}
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
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Accept'}
          </button>
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            onClick={handleRestart}
            disabled={saving}
          >
            Restart
          </button>
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
}