/**
 * Invitation Flow Integration Test
 * 
 * Tests the complete invitation lifecycle:
 * 1. Owner logs in via seed credentials
 * 2. Owner creates an invitation for a barber role
 * 3. Owner signs out
 * 4. Invitee signs up using the invitation link
 * 5. Verify user is created with 'barber' role
 * 6. Verify user is redirected to /dashboard/barber
 * 
 * Credentials from genesis-seed.ts:
 * - Owner: dev_owner@barbemnt.com / DevPass123!
 * - Super Admin: superadmin@barbemnt.com / SuperPass123!
 */

import { test, expect } from '@playwright/test';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, invitations } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

const OWNER_EMAIL = 'dev_owner@barbemnt.com';
const OWNER_PASSWORD = 'DevPass123!';
const TEST_INVITEE_EMAIL = `invitee.test.${Date.now()}@barbemnt.com`;
const TEST_INVITEE_PASSWORD = 'TestPass123!';

test.describe('Invitation Flow', () => {
  let teamId: number;
  let inviteId: number;

  test.beforeAll(async () => {
    await cleanUpTestData();

    // Verify owner exists
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.email, OWNER_EMAIL))
      .limit(1);

    if (!owner) {
      throw new Error(`Owner user not found. Please run the seed script first. Credentials: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
    }

    // Get owner's team
    const ownerMemberships = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, owner.id))
      .limit(1);

    if (ownerMemberships.length === 0) {
      throw new Error('Owner does not have a team. Please run the seed script first.');
    }

    teamId = ownerMemberships[0].teamId;
  });

  test.afterAll(async () => {
    await cleanUpTestData();
  });

  test('Owner creates invitation, signs out, invitee signs up with barber role', async ({ page }) => {
    // Step 1: Owner logs in
    console.log('\n🔐 Step 1: Owner logs in');
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', OWNER_EMAIL);
    await page.fill('input[name="password"]', OWNER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard/owner
    await expect(page).toHaveURL(/\/dashboard\/owner/, { timeout: 10000 });
    console.log('   ✓ Owner logged in successfully');

    // Step 2: Navigate to staff management
    console.log('\n📋 Step 2: Navigate to staff management');
    await page.goto('/dashboard/owner/staff');
    await expect(page.locator('h1:has-text("Staff")')).toBeVisible({ timeout: 5000 });
    console.log('   ✓ Staff page loaded');

    // Step 3: Create invitation
    console.log('\n✉️  Step 3: Create barber invitation');
    await page.fill('input[name="email"]', TEST_INVITEE_EMAIL);
    
    // Ensure "Barber" role is selected (default)
    const barberRadio = page.locator('input[name="role"][value="barber"]');
    await expect(barberRadio).toBeChecked();
    
    // Click Invite button
    await page.click('button:has-text("Invite Member")');
    
    // Verify success message
    await expect(page.locator('text=Invitation sent successfully')).toBeVisible({ timeout: 5000 });
    console.log('   ✓ Invitation sent');

    // Fetch invitation ID from database
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.email, TEST_INVITEE_EMAIL))
      .limit(1);
    
    expect(invitation).toBeDefined();
    expect(invitation.status).toBe('pending');
    expect(invitation.role).toBe('barber');
    expect(invitation.teamId).toBe(teamId);
    
    inviteId = invitation.id;
    console.log(`   ✓ Invitation ID: ${inviteId}`);

    // Step 4: Owner signs out by clearing cookies
    console.log('\n👋 Step 4: Owner signs out');
    await page.context().clearCookies();
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    console.log('   ✓ Owner signed out (cookies cleared)');

    // Step 5: Invitee navigates to sign-up with inviteId
    console.log('\n📝 Step 5: Invitee visits sign-up page');
    await page.goto(`/sign-up?inviteId=${inviteId}`);
    
    // Verify invitation banner is shown
    await expect(page.locator('text=You\'ve been invited to join')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=As a barber')).toBeVisible();
    console.log('   ✓ Invitation banner displayed');

    // Step 6: Invitee fills sign-up form
    console.log('\n✍️  Step 6: Invitee fills sign-up form');
    await page.fill('input[name="email"]', TEST_INVITEE_EMAIL);
    await page.fill('input[name="password"]', TEST_INVITEE_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Step 7: Verify redirect to barber dashboard (NOT user dashboard)
    console.log('\n🚀 Step 7: Verify redirect to barber dashboard');
    await expect(page).toHaveURL(/\/dashboard\/barber/, { timeout: 10000 });
    console.log('   ✓ Redirected to /dashboard/barber');

    // Step 8: Verify database state
    console.log('\n🗄️  Step 8: Verify database state');
    
    // Verify user was created with barber role
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, TEST_INVITEE_EMAIL))
      .limit(1);
    
    expect(newUser).toBeDefined();
    expect(newUser.role).toBe('barber');
    console.log(`   ✓ User role: ${newUser.role}`);

    // Verify user was added to team with barber role
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, newUser.id))
      .limit(1);
    
    expect(membership).toBeDefined();
    expect(membership.teamId).toBe(teamId);
    expect(membership.role).toBe('barber');
    console.log(`   ✓ Team membership role: ${membership.role}`);

    // Verify invitation status is 'accepted'
    const [updatedInvitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, inviteId))
      .limit(1);
    
    expect(updatedInvitation.status).toBe('accepted');
    console.log(`   ✓ Invitation status: ${updatedInvitation.status}`);

    // Final summary
    console.log('\n✅ INVITATION FLOW TEST PASSED COMPLETELY');
    console.log('   - Owner created invitation for barber role');
    console.log('   - Owner signed out');
    console.log('   - Invitee signed up with inviteId');
    console.log('   - User created with role: barber');
    console.log('   - Redirected to: /dashboard/barber');
    console.log('   - Team membership created with role: barber');
    console.log('   - Invitation marked as accepted');
  });

  test('Regular sign-up (no invite) creates user role', async ({ page }) => {
    // Test that normal sign-up still works
    await page.goto('/sign-up');
    
    const email = `regular.user.${Date.now()}@barbemnt.com`;
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'RegularPass123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard\/user/, { timeout: 10000 });
    
    // Verify user was created with user role
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    expect(newUser.role).toBe('user');
    
    // Cleanup - soft delete the user (as per app's deleteAccount action)
    await db
      .update(users)
      .set({ deletedAt: new Date(), email: `${email}-deleted` })
      .where(eq(users.id, newUser.id));
  });
});

async function cleanUpTestData() {
  // Delete invitation
  await db
    .delete(invitations)
    .where(eq(invitations.email, TEST_INVITEE_EMAIL));
  
  // Delete team membership and user
  const [testUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_INVITEE_EMAIL))
    .limit(1);
  
  if (testUser) {
    await db
      .delete(teamMembers)
      .where(eq(teamMembers.userId, testUser.id));
    
    await db
      .delete(users)
      .where(eq(users.id, testUser.id));
  }
}
