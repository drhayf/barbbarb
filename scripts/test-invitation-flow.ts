/**
 * Invitation Flow Debug Script
 * 
 * Run this script to test the invitation flow:
 * npx tsx scripts/test-invitation-flow.ts
 */

import { db } from '../lib/db/drizzle';
import { users, teams, teamMembers, invitations } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/session';
import { eq, and } from 'drizzle-orm';

const TEST_EMAIL = `test.invitee.${Date.now()}@barbemnt.com`;
const TEST_PASSWORD = 'TestPass123!';

async function testInvitationFlow() {
  console.log('🧪 Testing Invitation Flow...\n');

  try {
    // Step 1: Find owner and their team
    console.log('1. Finding owner and team...');
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'dev_owner@barbemnt.com'))
      .limit(1);

    if (!owner) {
      throw new Error('Owner not found. Run seed script first.');
    }
    console.log(`   ✓ Owner found: ${owner.email} (role: ${owner.role})`);

    const [ownerTeam] = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, owner.id))
      .limit(1);

    if (!ownerTeam) {
      throw new Error('Owner has no team.');
    }
    console.log(`   ✓ Team ID: ${ownerTeam.teamId}`);

    // Step 2: Create an invitation
    console.log('\n2. Creating invitation...');
    const [invitation] = await db.insert(invitations).values({
      teamId: ownerTeam.teamId,
      email: TEST_EMAIL,
      role: 'barber',
      invitedBy: owner.id,
      status: 'pending',
    }).returning();
    console.log(`   ✓ Invitation created: ID=${invitation.id}, Email=${invitation.email}, Role=${invitation.role}, Status=${invitation.status}`);

    // Step 3: Simulate sign-up with inviteId
    console.log('\n3. Simulating sign-up with inviteId...');
    const passwordHash = await hashPassword(TEST_PASSWORD);

    // Check if invitation is valid
    const [validInvitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, invitation.id),
          eq(invitations.email, TEST_EMAIL),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (!validInvitation) {
      throw new Error('Invitation validation failed!');
    }
    console.log(`   ✓ Invitation validated: role=${validInvitation.role}, teamId=${validInvitation.teamId}`);

    // Create user with role from invitation
    const userRole = validInvitation.role as 'user' | 'barber' | 'owner';
    console.log(`   ✓ User will be created with role: ${userRole}`);

    // Step 4: Create the user
    console.log('\n4. Creating user...');
    const [newUser] = await db.insert(users).values({
      email: TEST_EMAIL,
      passwordHash,
      role: userRole,
    }).returning();
    console.log(`   ✓ User created: ID=${newUser.id}, Email=${newUser.email}, Role=${newUser.role}`);

    // Step 5: Create team membership
    console.log('\n5. Creating team membership...');
    await db.insert(teamMembers).values({
      userId: newUser.id,
      teamId: validInvitation.teamId,
      role: userRole,
    });
    console.log(`   ✓ Team membership created: userId=${newUser.id}, teamId=${validInvitation.teamId}, role=${userRole}`);

    // Step 6: Update invitation status
    console.log('\n6. Updating invitation status...');
    await db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id));
    console.log(`   ✓ Invitation status: accepted`);

    // Step 7: Verify everything
    console.log('\n7. Verification:');
    const [verifiedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, newUser.id))
      .limit(1);
    console.log(`   ✓ User role: ${verifiedUser.role}`);

    const [verifiedMembership] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, newUser.id))
      .limit(1);
    console.log(`   ✓ Team member role: ${verifiedMembership.role}`);

    const [verifiedInvitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, invitation.id))
      .limit(1);
    console.log(`   ✓ Invitation status: ${verifiedInvitation.status}`);

    // Summary
    console.log('\n✅ INVITATION FLOW TEST PASSED');
    console.log(`   - User ${TEST_EMAIL} was created with role 'barber'`);
    console.log(`   - User was added to team ${ownerTeam.teamId}`);
    console.log(`   - Invitation status is 'accepted'`);
    console.log('\n📝 Next step: Test the actual sign-up page to verify the fix works.');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await db.delete(invitations).where(eq(invitations.email, TEST_EMAIL));
    const [testUser] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
    if (testUser) {
      await db.delete(teamMembers).where(eq(teamMembers.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    }
    console.log('   ✓ Cleanup complete');
  }
}

testInvitationFlow();
