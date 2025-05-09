import Link from 'next/link';

type Challenge = {
  challenge_id: string;
  challenges: { title: string };
};

export default function ChallengeList({ challenges }: { challenges: Challenge[] }) {
  return (
    <ul className="mt-4">
      {challenges.length === 0 ? (
        <li className="text-gray-500">No challenges found.</li>
      ) : (
        challenges.map((item) => (
          <li key={item.challenge_id} className="py-2">
            <Link
              href={`/dashboard/challenges/${item.challenge_id}`}
              className="text-indigo-600 hover:underline"
              aria-label={`View challenge: ${item.challenges.title}`}
            >
              {item.challenges.title}
            </Link>
          </li>
        ))
      )}
    </ul>
  );
}