'use server';

import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, barberProfiles, bookings, services, products, invitations, activityLogs, posts } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function deleteAnyUser(userId: number) {
  const caller = await getUser();
  
  if (!caller || caller.role !== 'super_admin') {
    throw new Error('Unauthorized: Super Admin access required');
  }

  // Prevent self-deletion
  if (caller.id === userId) {
    throw new Error('Cannot delete your own super admin account');
  }

  try {
    // Start transaction for cascading deletes
    await db.transaction(async (tx) => {
      // 1. Get user's team memberships
      const userMemberships = await tx
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, userId));

      const teamIds = userMemberships.map(m => m.teamId);

      // 2. Delete barber profile
      await tx.delete(barberProfiles).where(eq(barberProfiles.userId, userId));

      // 3. Delete bookings where user is customer
      await tx.delete(bookings).where(eq(bookings.customerId, userId));

      // 4. Delete bookings where user is barber
      await tx.delete(bookings).where(eq(bookings.barberId, userId));

      // 5. Delete team memberships
      await tx.delete(teamMembers).where(eq(teamMembers.userId, userId));

      // 6. Delete invitations sent by this user
      await tx.delete(invitations).where(eq(invitations.invitedBy, userId));

      // 7. Delete activity logs
      await tx.delete(activityLogs).where(eq(activityLogs.userId, userId));

      // 8. Delete posts by this user
      await tx.delete(posts).where(eq(posts.barberId, userId));

      // 9. For each team, check if it has no other members, then delete team and related data
      for (const teamId of teamIds) {
        const remainingMembers = await tx
          .select()
          .from(teamMembers)
          .where(eq(teamMembers.teamId, teamId));

        if (remainingMembers.length === 0) {
          // Delete team-related data
          await tx.delete(services).where(eq(services.teamId, teamId));
          await tx.delete(products).where(eq(products.teamId, teamId));
          await tx.delete(bookings).where(eq(bookings.teamId, teamId));
          await tx.delete(invitations).where(eq(invitations.teamId, teamId));
          await tx.delete(activityLogs).where(eq(activityLogs.teamId, teamId));
          await tx.delete(posts).where(eq(posts.teamId, teamId));
          
          // Delete the team
          await tx.delete(teams).where(eq(teams.id, teamId));
        }
      }

      // 10. Finally, delete the user
      await tx.delete(users).where(eq(users.id, userId));
    });

    revalidatePath('/admin');
    return { success: true, message: 'User and all related data deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

export async function getAdminStats() {
  const caller = await getUser();
  
  if (!caller || caller.role !== 'super_admin') {
    throw new Error('Unauthorized: Super Admin access required');
  }

  const [totalUsers, totalTeams] = await Promise.all([
    db.select({ count: users.id }).from(users).where(isNull(users.deletedAt)),
    db.select({ count: teams.id }).from(teams),
  ]);

  return {
    totalUsers: totalUsers[0]?.count || 0,
    totalTeams: totalTeams[0]?.count || 0,
  };
}

export async function getAllUsers() {
  const caller = await getUser();
  
  if (!caller || caller.role !== 'super_admin') {
    throw new Error('Unauthorized: Super Admin access required');
  }

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(users.createdAt);

  return allUsers;
}

export async function getAllTeams() {
  const caller = await getUser();
  
  if (!caller || caller.role !== 'super_admin') {
    throw new Error('Unauthorized: Super Admin access required');
  }

  const allTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      createdAt: teams.createdAt,
      planName: teams.planName,
      subscriptionStatus: teams.subscriptionStatus,
    })
    .from(teams)
    .orderBy(teams.createdAt);

  return allTeams;
}
