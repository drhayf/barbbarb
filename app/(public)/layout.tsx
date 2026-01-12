import { StorefrontHeader } from '@/components/storefront/Header';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />
      <main className="mx-auto w-full max-w-xl">{children}</main>
    </div>
  );
}
