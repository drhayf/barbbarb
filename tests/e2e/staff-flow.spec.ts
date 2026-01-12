import { test, expect } from '@playwright/test';

const OWNER_EMAIL = 'dev_owner@barbemnt.com';
const OWNER_PASSWORD = 'DevPass123!';
const TEST_BARBER_EMAIL = 'test_barber@barbemnt.com';

test.describe('Staff Invite Flow', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies for a clean state
    await context.clearCookies();
  });

  test('should allow owner to invite a barber and revoke the invitation', async ({ page }) => {
    // Step 1: Go to sign-in page
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/\/sign-in/);

    // Step 2: Fill in credentials and sign in
    await page.fill('input[name="email"]', OWNER_EMAIL);
    await page.fill('input[name="password"]', OWNER_PASSWORD);
    await page.click('button[type="submit"]');

    // Step 3: Wait for redirection to dashboard
    await page.waitForURL(/\/dashboard\/owner/);
    await expect(page).toHaveURL(/\/dashboard\/owner/);

    // Step 4: Navigate to Staff page
    await page.click('a[href="/dashboard/owner/staff"]');
    await page.waitForURL(/\/dashboard\/owner\/staff/);
    await expect(page).toHaveURL(/\/dashboard\/owner\/staff/);

    // Step 5: Fill in the invite form
    await page.fill('input[name="email"]', TEST_BARBER_EMAIL);
    
    // Ensure "Barber" role is selected (default)
    const barberRadio = page.locator('input[name="role"][value="barber"]');
    await expect(barberRadio).toBeChecked();

    // Step 6: Click Invite button
    await page.click('button:has-text("Invite Member")');

    // Step 7: Wait for the pending invitation to appear in the list
    const pendingSection = page.locator('text=Pending Invitations').first();
    const pendingCard = pendingSection.locator('..').locator('..');
    const pendingEmail = pendingCard.locator(`p.font-medium:has-text("${TEST_BARBER_EMAIL}")`);
    await expect(pendingEmail).toBeVisible({ timeout: 15000 });

    // Step 8: Click Revoke button
    const revokeButton = pendingCard.locator('button:has-text("Revoke")');
    await expect(revokeButton).toBeVisible();
    await revokeButton.click();

    // Step 9: Wait for either the email to disappear OR the "No pending invitations" message
    await expect(async () => {
      // Check if the email is still visible
      const emailVisible = await pendingEmail.isVisible().catch(() => false);
      // Check if "No pending invitations" is visible
      const noInvitationsVisible = await pendingCard.locator('text=No pending invitations').isVisible().catch(() => false);
      // Test passes if email is gone OR no invitations message is shown
      expect(!emailVisible || noInvitationsVisible).toBe(true);
    }).toPass({ timeout: 20000 });
  });
});
