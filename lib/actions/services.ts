'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { services, type Service, type NewService } from '@/lib/db/schema';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, and } from 'drizzle-orm';

// ============================================
// TYPE INFERENCES
// ============================================


// ============================================
// SCHEMAS
// ============================================

const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(1, 'Duration must be at least 1 minute'),
  price: z.coerce.number().int().min(0, 'Price cannot be negative'), // Stored in cents
});

const deleteServiceSchema = z.object({
  serviceId: z.coerce.number().int(),
});

// ============================================
// ACTIONS
// ============================================

/**
 * Get all services for the current user's team
 */
export async function getServices(): Promise<Service[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    return [];
  }

  const result = await db
    .select()
    .from(services)
    .where(eq(services.teamId, userWithTeam.teamId))
    .orderBy(services.name);

  return result;
}

/**
 * Create a new service for the team
 */
export const createService = validatedActionWithUser(
  createServiceSchema,
  async (data, _formData, user) => {
    const userWithTeam = await getUserWithTeam(user.id);
    
    if (!userWithTeam?.teamId) {
      return { error: 'You are not part of a team' };
    }

    if (user.role !== 'owner') {
      return { error: 'Only owners can create services' };
    }

    const newService: NewService = {
      teamId: userWithTeam.teamId,
      name: data.name,
      description: data.description || null,
      durationMinutes: data.durationMinutes,
      price: data.price,
      isActive: true,
    };

    await db.insert(services).values(newService);
    revalidatePath('/dashboard/owner/services');

    return { success: 'Service created successfully' };
  }
);

/**
 * Delete a service (only if it belongs to the user's team)
 */
export const deleteService = validatedActionWithUser(
  deleteServiceSchema,
  async (data, _formData, user) => {
    const userWithTeam = await getUserWithTeam(user.id);
    
    if (!userWithTeam?.teamId) {
      return { error: 'You are not part of a team' };
    }

    if (user.role !== 'owner') {
      return { error: 'Only owners can delete services' };
    }

    // Verify the service belongs to the user's team before deleting
    const [service] = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.id, data.serviceId),
          eq(services.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (!service) {
      return { error: 'Service not found' };
    }

    await db
      .delete(services)
      .where(eq(services.id, data.serviceId));

    revalidatePath('/dashboard/owner/services');

    return { success: 'Service deleted successfully' };
  }
);

/**
 * Toggle service active status
 */
export async function toggleServiceActive(serviceId: number, isActive: boolean) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    throw new Error('Team not found');
  }

  if (user.role !== 'owner') {
    throw new Error('Only owners can toggle services');
  }

  // Verify ownership
  const [service] = await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.id, serviceId),
        eq(services.teamId, userWithTeam.teamId)
      )
    )
    .limit(1);

  if (!service) {
    throw new Error('Service not found');
  }

  await db
    .update(services)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(services.id, serviceId));

  revalidatePath('/dashboard/owner/services');
}
