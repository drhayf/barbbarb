'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Users,
  Settings,
  Shield,
  Activity,
  Menu,
  Calendar,
  ShoppingBag,
  Scissors,
  LayoutDashboard,
  Megaphone
} from 'lucide-react';
import useSWR from 'swr';
import { User, UserRole } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Navigation configuration by role
const navConfig = {
  [UserRole.OWNER]: [
    { href: '/dashboard/owner', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/owner/feed', icon: Megaphone, label: 'Shop Feed' },
    { href: '/dashboard/owner/staff', icon: Users, label: 'Staff' },
    { href: '/dashboard/owner/services', icon: Scissors, label: 'Services' },
    { href: '/dashboard/owner/products', icon: ShoppingBag, label: 'Products' },
    { href: '/dashboard/owner/settings', icon: Settings, label: 'Settings' }
  ],
  [UserRole.BARBER]: [
    { href: '/dashboard/barber', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/barber/schedule', icon: Calendar, label: 'Schedule' },
    { href: '/dashboard/barber/profile', icon: Settings, label: 'Profile' }
  ],
  [UserRole.USER]: [
    { href: '/dashboard/user', icon: LayoutDashboard, label: 'My Bookings' },
    { href: '/dashboard/user/shops', icon: Scissors, label: 'Find Shops' },
    { href: '/dashboard/user/history', icon: Activity, label: 'History' }
  ],
  [UserRole.SUPER_ADMIN]: [
    { href: '/dashboard/admin', icon: Shield, label: 'Admin Panel' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' }
  ]
};

// Default nav for unauthenticated or unknown roles
const defaultNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
];

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch user data to determine role
  const { data: user } = useSWR<User>('/api/user', fetcher);

  // Get nav items based on user role
  const navItems = user && user.role && navConfig[user.role as UserRole]
    ? navConfig[user.role as UserRole]
    : defaultNav;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <span className="font-medium">Menu</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={`shadow-none my-1 w-full justify-start ${
                    pathname === item.href ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
