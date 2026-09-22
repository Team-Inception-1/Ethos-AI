import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { deleteDocumentFile } from '@/lib/storage';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // Check Prisma DB first
    const dbDoc = await prisma.document.findUnique({
      where: { id },
      include: { documentScan: true },
    });

    if (dbDoc) {
      return NextResponse.json({ document: dbDoc });
    }

    const document = db.getDocumentById(id);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error getting document:', error);
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    let storageKey: string | null = null;

    // 1. Delete from PostgreSQL if exists
    try {
      const dbDoc = await prisma.document.findUnique({ where: { id } });
      if (dbDoc) {
        storageKey = dbDoc.storageKey;
        await prisma.document.delete({ where: { id } });
      }
    } catch (e) {
      console.warn('[Document DELETE] DB deletion warning:', e);
    }

    // 2. Delete from in-memory DB if exists
    const memoryDoc = db.deleteDocument(id);
    if (memoryDoc?.storageKey) {
      storageKey = memoryDoc.storageKey;
    }

    // 3. Delete from Neon Object Storage S3 bucket
    if (storageKey) {
      await deleteDocumentFile(storageKey);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
