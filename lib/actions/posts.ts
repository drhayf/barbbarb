'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { posts, teamMembers } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { and, eq } from 'drizzle-orm';
import { UserRole } from '@/lib/db/schema';
import { z } from 'zod';
import { uploadPortfolioImage, deletePortfolioImage } from '@/lib/supabase';

export type PostType = 'portfolio' | 'announcement';

// Zod schema for portfolio posts - imageUrl is now required after upload
const portfolioPostSchema = z.object({
  type: z.literal('portfolio'),
  title: z.string().optional(),
  imageUrl: z.string().min(1, { message: 'Please upload an image' }),
  caption: z.string().optional(),
});

// Zod schema for announcements - no image required
const announcementSchema = z.object({
  type: z.literal('announcement'),
  title: z.string().min(1, { message: 'Title is required for announcements' }),
  imageUrl: z.string().optional(),
  caption: z.string().optional(),
});

// Discriminated union schema
const createPostSchema = z.union([portfolioPostSchema, announcementSchema]);

export interface CreatePostInput {
  type: PostType;
  title?: string;
  imageUrl?: string;
  caption?: string;
}

export interface UploadImageInput {
  // Accept either a browser File or a serialized payload with typed bytes
  file: File | { name?: string; type?: string; size?: number; data?: Uint8Array };
}

export async function createPost(formData: CreatePostInput) {
  // Security: Verify caller is an 'owner' or 'barber'
  const user = await getUser();
  if (!user) {
    return { error: 'Unauthorized: You must be logged in' };
  }

  if (user.role !== UserRole.OWNER && user.role !== UserRole.BARBER) {
    return { error: 'Forbidden: Only owners and barbers can create posts' };
  }

  // Get user's team
  const team = await getTeamForUser();
  if (!team) {
    return { error: 'Team not found' };
  }

  // Zod validation
  const validationResult = createPostSchema.safeParse(formData);
  
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors[0]?.message || 'Validation failed';
    return { error: errorMessage };
  }

  const { type, title, imageUrl, caption } = validationResult.data;

  // Determine barberId: null for owners (shop-level), user's id for barbers
  const barberId = user.role === UserRole.OWNER ? null : user.id;

  // Insert the post
  await db.insert(posts).values({
    teamId: team.id,
    barberId,
    type,
    title: title || null,
    imageUrl: imageUrl || null,
    caption: caption || null,
  });

  // Revalidation
  revalidatePath('/');
  revalidatePath('/dashboard/owner/feed');

  return { success: true };
}

/**
 * Upload a portfolio image to Supabase Storage
 * @param input - Object containing the file to upload
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(input: UploadImageInput) {
  // Security: Verify caller is an 'owner' or 'barber'
  const user = await getUser();
  if (!user) {
    return { error: 'Unauthorized: You must be logged in' };
  }

  if (user.role !== UserRole.OWNER && user.role !== UserRole.BARBER) {
    return { error: 'Forbidden: Only owners and barbers can upload images' };
  }

  // Get user's team
  const team = await getTeamForUser();
  if (!team) {
    return { error: 'Team not found' };
  }

  // Inspect incoming file and normalize shapes
  const rawFile: any = (input as any)?.file;
  try {
    console.log('uploadImage called. incoming file keys:', rawFile && Object.keys(rawFile));
  } catch (e) {
    console.log('uploadImage: failed to log incoming file keys', e);
  }

  if (!rawFile) {
    return { error: 'No image file detected in the request.' };
  }

  // Normalize to an object with arrayBuffer()
  let normalizedFile: { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> } | null = null;

  if (typeof rawFile.arrayBuffer === 'function') {
    normalizedFile = {
      name: rawFile.name || 'file.jpg',
      type: rawFile.type || 'application/octet-stream',
      size: rawFile.size || 0,
      arrayBuffer: () => rawFile.arrayBuffer(),
    };
  } else if (rawFile.data && (rawFile.data instanceof Uint8Array || Array.isArray(rawFile.data))) {
    const arr = rawFile.data instanceof Uint8Array ? rawFile.data : Uint8Array.from(rawFile.data);
    normalizedFile = {
      name: rawFile.name || 'file.jpg',
      type: (rawFile.type || 'application/octet-stream').toLowerCase(),
      size: arr.byteLength,
      arrayBuffer: async () => arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer,
    };
  } else {
    console.error('uploadImage: unsupported file shape received', { keys: Object.keys(rawFile) });
    return { error: 'No image file detected in the request.' };
  }

  // Diagnostic log for normalized file
  try {
    console.log(`uploadImage normalized file: name=${normalizedFile.name}, size=${normalizedFile.size}, type=${normalizedFile.type}`);
  } catch (e) {
    console.log('uploadImage: failed to log normalized file', e);
  }

  // Check file type (allow jpg/jpe/png/webp)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes((normalizedFile.type || '').toLowerCase())) {
    return { error: 'Unsupported format. Use JPEG, PNG, or WebP.' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (normalizedFile.size > maxSize) {
    return { error: 'File too large. Maximum size is 10MB.' };
  }

  // Extra diagnostic for files over 100KB
  if (normalizedFile.size > 100 * 1024) {
    console.log('uploadImage: large file detected (>100KB). Proceeding with upload.');
  }

  try {
    // Upload to Supabase Storage
    const imageUrl = await uploadPortfolioImage(normalizedFile as unknown as File, team.id);
    return { success: true, imageUrl };
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Failed to upload image. ${message}` };
  }
}

export async function deletePost(postId: number) {
  // Security: Verify caller is authenticated
  const user = await getUser();
  if (!user) {
    return { error: 'Unauthorized: You must be logged in' };
  }

  // Get user's team
  const team = await getTeamForUser();
  if (!team) {
    return { error: 'Team not found' };
  }

  // Fetch the post to check ownership
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.teamId, team.id)),
  });

  if (!post) {
    return { error: 'Post not found or you do not have permission to delete it' };
  }

  // Ownership check: 
  // - Owners can delete any post in their team
  // - Barbers can only delete their own posts
  if (user.role === UserRole.BARBER && post.barberId !== user.id) {
    return { error: 'You can only delete your own posts' };
  }

  // Delete image from Supabase Storage if it exists
  if (post.imageUrl) {
    try {
      await deletePortfolioImage(post.imageUrl);
    } catch (error) {
      console.error('Failed to delete image from storage:', error);
      // Continue with post deletion even if image deletion fails
    }
  }

  // Delete the post
  await db.delete(posts).where(eq(posts.id, postId));

  // Revalidation
  revalidatePath('/');
  revalidatePath('/dashboard/owner/feed');

  return { success: true };
}
