import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ImageOff } from 'lucide-react';
import type { PublicPost } from '@/lib/db/queries';

interface PostCardProps {
  post: PublicPost;
}

/**
 * Validates if a string is a valid URL starting with http:// or https://
 */
function isValidUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function PostCard({ post }: PostCardProps) {
  const barberName = post.barber?.name || 'Unknown Barber';
  const barberInitials = barberName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const isAnnouncement = post.type === 'announcement';
  
  // Defensive: Validate image URL before attempting to render
  const hasValidImage = isValidUrl(post.imageUrl);

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      {/* Header: Avatar + Name + Date */}
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-10 w-10 border border-gray-100">
          <AvatarImage src={post.barber?.avatarUrl || undefined} alt={barberName} />
          <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
            {barberInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {isAnnouncement ? post.title || 'Announcement' : barberName}
          </span>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
      </div>

      {/* Media: 4/5 Aspect Ratio for Instagram-style (Portfolio only) */}
      {/* Only render image section for portfolio posts with valid URLs */}
      {!isAnnouncement && (
        hasValidImage ? (
          <div className="relative w-full bg-gray-100">
            <div className="aspect-[4/5] w-full relative">
              <Image
                src={post.imageUrl!}
                alt="Barbershop work"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
                priority={false}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#f3f4f6;color:#9ca3af;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path>
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
          </div>
        ) : (
          // Fallback placeholder for invalid or missing images
          <div className="relative w-full bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '4/5' }}>
            <div className="flex flex-col items-center text-gray-400">
              <ImageOff className="h-12 w-12 mb-2" />
              <span className="text-sm">Image Unavailable</span>
            </div>
          </div>
        )
      )}

      <Separator className="my-0" />

      {/* Footer: Caption */}
      {post.caption && (
        <CardContent className="p-4">
          <p className="text-sm leading-relaxed text-gray-700">
            <span className="font-medium text-gray-900">
              {isAnnouncement ? 'Shop Update' : barberName}
            </span>{' '}
            {post.caption}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
