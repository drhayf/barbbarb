import Link from 'next/link';
import { getUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';

export async function StorefrontHeader() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4">
        {/* Brand - Left */}
        <Link href="/" className="group">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 transition-colors group-hover:text-gray-700">
            The Barbers Element
          </h1>
        </Link>

        {/* Smart Button - Right */}
        {user ? (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm" className="rounded-full font-medium text-gray-600 hover:text-gray-900">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
