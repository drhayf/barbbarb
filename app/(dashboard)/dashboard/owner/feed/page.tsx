import { redirect } from 'next/navigation';
import { getUser, getTeamForUser, getTeamPosts } from '@/lib/db/queries';
import FeedPageClient from './client';

export default async function FeedPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const team = await getTeamForUser();
  
  if (!team) {
    redirect('/dashboard');
  }

  const posts = await getTeamPosts(team.id);

  return <FeedPageClient posts={posts} />;
}
