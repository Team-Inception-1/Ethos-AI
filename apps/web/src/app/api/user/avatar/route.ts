import { NextResponse } from 'next/server';
import { uploadAvatarFile } from '@/lib/storage';
import { db } from '@/lib/db';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';

export async function POST(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = authorization.user.id;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files (JPEG, PNG, WEBP, GIF) are allowed' }, { status: 400 });
    }

    // Limit avatar size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image file must be under 5 MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Neon Object Storage
    const result = await uploadAvatarFile(buffer, file.name, file.type, userId);

    // Update in-memory DB record if user exists
    const user = db.getUserById(userId);
    if (user) {
      user.avatarUrl = result.url;
    }

    // Persist permanently into Neon Postgres public.User
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: result.url,
        },
      });
    } catch (dbErr) {
      console.warn('[Avatar Upload] Non-critical error updating Prisma User avatarUrl:', dbErr);
    }

    return NextResponse.json({
      success: true,
      avatarUrl: result.url,
      storageKey: result.key,
      provider: result.provider,
    });
  } catch (error) {
    console.error('Error uploading avatar to Neon Object Storage:', error);
    return NextResponse.json({ error: 'Failed to upload profile photo' }, { status: 500 });
  }
}
