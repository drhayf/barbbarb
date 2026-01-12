import { Card, CardContent } from '@/components/ui/card';
import { PostCard } from './PostCard';
import { AnnouncementCard } from './AnnouncementCard';
import type { PublicPost } from '@/lib/db/queries';

interface FeedProps {
  posts: PublicPost[];
}

export function Feed({ posts }: FeedProps) {
  if (posts.length === 0) {
    return (
      <Card className="mx-4 border-dashed border-2 border-gray-200 bg-gray-50/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-gray-100 p-4">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">Welcome to The Barbers Element</h3>
          <p className="max-w-sm text-sm text-gray-500">
            Our Instagram feed is getting polished up. Check back soon for the latest cuts, styles, and barbershop moments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 py-6">
      {posts.map((post) => {
        // Render announcement cards for announcements
        if (post.type === 'announcement') {
          return <AnnouncementCard key={post.id} post={post} />;
        }
        // Render portfolio posts using PostCard
        return <PostCard key={post.id} post={post} />;
      })}
    </div>
  );
}
