import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase Storage
// Note: These must be added to your .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    '⚠️ Supabase credentials missing. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.'
  );
}

// Create Supabase client with service role key (for admin operations like uploads)
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceRoleKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Bucket name for portfolio images (public bucket)
export const PORTFOLIO_BUCKET = 'portfolio';

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload
 * @param teamId - The team ID for organizing uploads
 * @returns The public URL of the uploaded image
 */
export async function uploadPortfolioImage(file: File, teamId: number): Promise<string> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }

  // Generate unique file path: team_[id]/[uuid].[extension]
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExtension}`;
  const filePath = `team_${teamId}/${fileName}`;

  // Convert file to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(PORTFOLIO_BUCKET)
    .upload(filePath, uint8Array, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(PORTFOLIO_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The full public URL of the image to delete
 * @returns True if deletion was successful
 */
export async function deletePortfolioImage(imageUrl: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }

  // Extract file path from URL
  // URL format: https://[project].supabase.co/storage/v1/object/public/portfolio/team_[id]/[uuid].[ext]
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    // Remove the bucket name and 'object/public/' prefix
    const filePath = pathParts.slice(-3).join('/');

    const { error } = await supabaseAdmin.storage
      .from(PORTFOLIO_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to parse image URL for deletion:', err);
    return false;
  }
}
