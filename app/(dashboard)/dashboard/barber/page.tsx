import Link from 'next/link';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { bookings, posts, barberProfiles } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Image as ImageIcon, Settings, PlusCircle } from 'lucide-react';

async function getBarberStats(userId: number) {
  // Upcoming confirmed appointments
  const upcomingAppointments = await db
    .select({ count: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.barberId, userId),
        eq(bookings.status, 'confirmed')
      )
    );

  // Portfolio posts count
  const portfolioPosts = await db
    .select({ count: posts.id })
    .from(posts)
    .where(eq(posts.barberId, userId));

  // Schedule status (check if availability exists for today)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const barberProfile = await db
    .select()
    .from(barberProfiles)
    .where(eq(barberProfiles.userId, userId))
    .limit(1);

  const hasAvailability = barberProfile[0]?.availability !== null;
  const isWorkingToday = hasAvailability;

  return {
    upcomingCount: upcomingAppointments[0]?.count || 0,
    portfolioCount: portfolioPosts[0]?.count || 0,
    isWorkingToday,
  };
}

export default async function BarberOverviewPage() {
  const user = await getUser();

  if (!user || user.role !== 'barber') {
    redirect('/sign-in');
  }

  const stats = await getBarberStats(user.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Barber Overview</h1>
        <p className="text-gray-500">Welcome back, {user.name || 'Barber'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingCount}</div>
            <p className="text-xs text-gray-500">Confirmed bookings</p>
          </CardContent>
        </Card>

        {/* Card 2: Portfolio Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Posts</CardTitle>
            <ImageIcon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.portfolioCount}</div>
            <p className="text-xs text-gray-500">Instagram-style posts</p>
          </CardContent>
        </Card>

        {/* Card 3: Schedule Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedule Status</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isWorkingToday ? 'Working' : 'Off'}
            </div>
            <p className="text-xs text-gray-500">
              {stats.isWorkingToday ? 'Available today' : 'No availability set'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gray-50/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-orange-100 p-3">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Schedule</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Update your availability and working hours
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard/barber/schedule">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Update Schedule
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-orange-100 p-3">
                <ImageIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Update Portfolio</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Add new work photos to your portfolio
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/barber/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
