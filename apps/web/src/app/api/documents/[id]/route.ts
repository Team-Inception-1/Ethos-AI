import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deleteDocumentFile } from '@/lib/storage';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
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
    const removed = db.deleteDocument(id);
    if (!removed) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    if (removed.storageKey) {
      await deleteDocumentFile(removed.storageKey);
    }
    return NextResponse.json({ success: true, removed });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
