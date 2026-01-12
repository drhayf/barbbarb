import { NextResponse } from 'next/server';
import { uploadPortfolioImage } from '@/lib/supabase';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export async function POST(req: Request) {
  try {
    // Minimal auth/permission checks to match existing patterns
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: You must be logged in' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'barber') {
      return NextResponse.json({ error: 'Forbidden: Only owners and barbers can upload images' }, { status: 403 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file detected in the request.' }, { status: 400 });
    }

    const name = (file as any).name || 'upload.jpg';
    const type = (file as any).type || 'application/octet-stream';
    const arrayBuffer = await file.arrayBuffer();
    const size = (arrayBuffer && arrayBuffer.byteLength) || (file as any).size || 0;

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(type.toLowerCase())) {
      return NextResponse.json({ error: 'Unsupported format. Use JPEG, PNG, or WebP.' }, { status: 400 });
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Prepare a File-like object the storage helper can consume
    const uploadFile: any = {
      name,
      type,
      size,
      arrayBuffer: async () => arrayBuffer,
    };

    try {
      const imageUrl = await uploadPortfolioImage(uploadFile as unknown as File, team.id);
      return NextResponse.json({ success: true, imageUrl });
    } catch (err) {
      console.error('Storage upload failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Storage Connection Error: ${message}` }, { status: 500 });
    }
  } catch (err) {
    console.error('Upload endpoint error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
