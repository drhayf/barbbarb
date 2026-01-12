import { getPublicFeed } from '@/lib/db/queries';
import { Feed } from '@/components/storefront/Feed';

export const dynamic = 'force-dynamic';

export default async function PublicStorefrontPage() {
  const posts = await getPublicFeed();

  return <Feed posts={posts} />;
}
