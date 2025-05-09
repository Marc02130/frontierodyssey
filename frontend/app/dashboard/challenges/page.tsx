import { redirect } from 'next/navigation';

export default function Challenges() {
  redirect('/dashboard/challenges/active');
}