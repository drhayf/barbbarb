import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { UserRole } from '@/lib/db/schema';

export default async function DashboardPage() {
  const user = await getUser();

  // Debug logging for role detection
  console.log('[Dashboard] User role detected:', {
    userId: user?.id,
    email: user?.email,
    role: user?.role,
    timestamp: new Date().toISOString()
  });

  // If no user, redirect to login
  if (!user) {
    redirect('/sign-in');
  }

  // Traffic Controller: Redirect based on role
  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      redirect('/dashboard/admin');
    case UserRole.OWNER:
      redirect('/dashboard/owner');
    case UserRole.BARBER:
      redirect('/dashboard/barber');
    case UserRole.USER:
    default:
      redirect('/dashboard/user');
  }
}
