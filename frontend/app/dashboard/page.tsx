import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch ELO ratings
  const { data: eloRatings } = await supabase
    .from('elo_ratings')
    .select('subject, rating')
    .eq('user_id', user.id);

  // Fetch mastery logs
  const { data: masteryLogs } = await supabase
    .from('mastery_logs')
    .select('challenge_id, challenges(title), mastery_level, task_completion_count')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null);

  // Fetch recommended challenges
  const { data: recommended } = await supabase
    .from('challenge_recommendations')
    .select('challenge_id, challenges(title)')
    .eq('user_id', user.id)
    .limit(3);

  // Fetch incomplete tasks
  const { data: incompleteTasks } = await supabase
    .from('task_progress')
    .select('challenge_id, challenges(title)')
    .eq('user_id', user.id)
    .eq('is_completed', false)
    .limit(3);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-indigo-600 mb-6">Welcome to Your Dashboard</h1>

      {/* Progress/Stats Section */}
      <section aria-labelledby="progress-heading" className="mb-8">
        <h2 id="progress-heading" className="text-2xl font-semibold text-indigo-600 mb-4">
          Progress & Stats 📊
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ELO Ratings */}
          <div className="bg-blue-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-800">ELO Ratings</h3>
            {eloRatings && eloRatings.length > 0 ? (
              <ul className="mt-2">
                {eloRatings.map((rating) => (
                  <li key={rating.subject} className="py-1" aria-label={`ELO Rating for ${rating.subject}`}>
                    {rating.subject}: {rating.rating}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mt-2">No ELO ratings yet.</p>
            )}
          </div>
          {/* Mastery Levels */}
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-800">Completed Challenges</h3>
            {masteryLogs && masteryLogs.length > 0 ? (
              <ul className="mt-2">
                {masteryLogs.map((log) => (
                  <li key={log.challenge_id} className="py-1" aria-label={`Mastery Level for ${log.challenges.title}`}>
                    {log.challenges.title}: {log.mastery_level}% ({log.task_completion_count} tasks)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mt-2">No completed challenges yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Notifications/Alerts Section */}
      <section aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" className="text-2xl font-semibold text-indigo-600 mb-4">
          Notifications 🔔
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recommended Challenges */}
          <div className="bg-indigo-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-indigo-800">New Challenges</h3>
            {recommended && recommended.length > 0 ? (
              <ul className="mt-2">
                {recommended.map((item) => (
                  <li key={item.challenge_id} className="py-1">
                    <Link
                      href={`/dashboard/challenges/${item.challenge_id}`}
                      className="text-indigo-600 hover:underline"
                      aria-label={`Start challenge: ${item.challenges.title}`}
                    >
                      {item.challenges.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mt-2">No new challenges available.</p>
            )}
            <Link
              href="/dashboard/challenges/recommended"
              className="text-indigo-600 hover:underline mt-2 inline-block"
              aria-label="View all recommended challenges"
            >
              View All
            </Link>
          </div>
          {/* Incomplete Tasks */}
          <div className="bg-yellow-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-yellow-800">Incomplete Tasks</h3>
            {incompleteTasks && incompleteTasks.length > 0 ? (
              <ul className="mt-2">
                {incompleteTasks.map((item) => (
                  <li key={item.challenge_id} className="py-1">
                    <Link
                      href={`/dashboard/challenges/${item.challenge_id}`}
                      className="text-indigo-600 hover:underline"
                      aria-label={`Resume challenge: ${item.challenges.title}`}
                    >
                      {item.challenges.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mt-2">No incomplete tasks.</p>
            )}
            <Link
              href="/dashboard/challenges/active"
              className="text-indigo-600 hover:underline mt-2 inline-block"
              aria-label="View all active challenges"
            >
              View All
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}