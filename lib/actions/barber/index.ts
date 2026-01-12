'use server';

import { db } from '@/lib/db/drizzle';
import { barberProfiles } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { defaultWeeklyAvailability, WeeklyAvailability } from '@/lib/types/barber-profile';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================
// GET BARBER PROFILE
// ============================================

export async function getBarberProfile() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized: No active session');
  }

  const userId = session.user.id;

  // Try to fetch existing profile
  const existingProfile = await db.query.barberProfiles.findFirst({
    where: eq(barberProfiles.userId, userId),
  });

  if (existingProfile) {
    return existingProfile;
  }

  // Create default profile if it doesn't exist
  const [newProfile] = await db.insert(barberProfiles).values({
    userId,
    bio: '',
    specialties: [],
    instagramHandle: '',
    availability: defaultWeeklyAvailability as unknown as Record<string, unknown>,
  }).returning();

  return newProfile;
}

// ============================================
// UPDATE BARBER PROFILE
// ============================================

export interface UpdateBarberProfileData {
  bio: string;
  specialties: string[];
  instagramHandle: string;
}

export async function updateBarberProfile(data: UpdateBarberProfileData) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized: No active session');
  }

  const userId = session.user.id;

  const result = await db.update(barberProfiles)
    .set({
      bio: data.bio,
      specialties: data.specialties,
      instagramHandle: data.instagramHandle,
      updatedAt: new Date(),
    })
    .where(eq(barberProfiles.userId, userId))
    .returning();

  revalidatePath('/dashboard/barber/schedule');
  
  return { success: true, profile: result[0] };
}

// ============================================
// UPDATE AVAILABILITY
// ============================================

export async function updateAvailability(availabilityData: WeeklyAvailability) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized: No active session');
  }

  const userId = session.user.id;

  // Ensure profile exists first
  await getBarberProfile();

  const result = await db.update(barberProfiles)
    .set({
      availability: availabilityData as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(barberProfiles.userId, userId))
    .returning();

  revalidatePath('/dashboard/barber/schedule');
  
  return { success: true, profile: result[0] };
}

// ============================================
// SAVE FULL PROFILE (Profile + Availability)
// ============================================

export async function saveBarberProfileAndSchedule(
  profileData: UpdateBarberProfileData,
  availabilityData: WeeklyAvailability
) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized: No active session');
  }

  const userId = session.user.id;

  // Ensure profile exists first
  await getBarberProfile();

  // Update both profile and availability in one go
  const result = await db.update(barberProfiles)
    .set({
      bio: profileData.bio,
      specialties: profileData.specialties,
      instagramHandle: profileData.instagramHandle,
      availability: availabilityData as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(barberProfiles.userId, userId))
    .returning();

  revalidatePath('/dashboard/barber/schedule');
  
  return { success: true, profile: result[0] };
}
