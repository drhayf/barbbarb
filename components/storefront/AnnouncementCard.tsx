import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import type { PublicPost } from '@/lib/db/queries';

interface AnnouncementCardProps {
  post: PublicPost;
}

export function AnnouncementCard({ post }: AnnouncementCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          {post.title || 'Announcement'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-gray-700">{post.caption}</p>
        <p className="text-xs text-muted-foreground mt-3">{formattedDate}</p>
      </CardContent>
    </Card>
  );
}