import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadDocumentFile } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId') || undefined;
    const documents = db.getDocuments(ownerId);
    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents', details: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as any) || 'other';
    const ownerId = (formData.get('ownerId') as string) || 'usr-student-01';
    const applicationId = (formData.get('applicationId') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Format human-readable size
    let sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
    if (file.size > 1024 * 1024) {
      sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Upload to storage (Neon S3 / local)
    const { key, url, sizeBytes } = await uploadDocumentFile(
      buffer,
      file.name,
      file.type,
      ownerId
    );

    const newDoc = db.createDocument({
      ownerId,
      applicationId,
      name: file.name,
      type,
      size: sizeStr,
      sizeBytes,
      mimeType: file.type || 'application/octet-stream',
      storageKey: key,
      storageUrl: url,
      version: 1,
      riskScore: null,
      verdict: null,
      flags: [],
    });

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
