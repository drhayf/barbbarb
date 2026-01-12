import { test, expect } from '@playwright/test';

// Require SUPABASE service key in CI/dev env to run an end-to-end upload test.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('Multipart upload endpoint', () => {
  test.skip(!SUPABASE_KEY, 'SUPABASE_SERVICE_ROLE_KEY is not set - skipping actual upload test');

  test('uploads a >=100KB image via multipart/form-data', async ({ request }) => {
    // Construct a 150KB buffer to guarantee size > 100KB
    const sizeBytes = 150 * 1024;
    const buffer = Buffer.alloc(sizeBytes, 0xff); // filled with 0xff

    const response = await request.post('/api/uploads', {
      multipart: {
        file: {
          name: 'large-test.jpg',
          mimeType: 'image/jpeg',
          buffer,
        },
      },
    });

    const body = await response.json();

    expect(response.ok()).toBeTruthy();
    expect(body).toBeTruthy();
    expect(body.success).toBe(true);
    expect(body.imageUrl).toBeTruthy();
  });
});
