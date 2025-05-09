import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ChallengePage({ params }: { params: { challenge_id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('title, subject, theme, tasks, exploration')
    .eq('challenge_id', params.challenge_id)
    .single();

  if (error || !challenge) {
    return <div>Challenge not found</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{challenge.title}</h1>
      <p className="text-gray-600">Subject: {challenge.subject} | Theme: {challenge.theme}</p>
      <div className="mt-4">
        <p>{challenge.exploration.prompt}</p>
        {challenge.exploration.image && (
          <img src={challenge.exploration.image} alt="Challenge exploration" className="mt-2" />
        )}
      </div>
      <div className="mt-6">
        {Object.entries(challenge.tasks).map(([taskId, task]: [string, any]) => (
          <div key={taskId} className="mb-4 p-4 border rounded">
            <h3 className="text-xl font-semibold">{task.prompt}</h3>
            {task.type === 'calculate' && <input type="number" className="mt-2 p-2 border" />}
            {task.type === 'text' && <textarea className="mt-2 p-2 border w-full" />}
          </div>
        ))}
      </div>
    </div>
  );
}