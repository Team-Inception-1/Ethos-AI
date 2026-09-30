import assert from 'node:assert/strict';
import { test } from 'node:test';
import { migrateDocuments } from './migrate-private-documents.mjs';

function fixtures() {
  const bytes = Buffer.from('%PDF-1.7\n%%EOF');
  const documents = Array.from({ length: 4 }, (_, index) => ({ id: `doc-${index}`, ownerId: 'student', storageKey: `documents/student/${index}.pdf`, mimeType: 'application/pdf', fileSize: bytes.length }));
  const objects = new Map(documents.map(document => ['documents/' + document.storageKey, bytes]));
  const events = [];
  const storage = { send: async command => {
    const { Bucket, Key, Body } = command.input; const key = Bucket + '/' + Key;
    if (command.constructor.name === 'PutObjectCommand') { objects.set(key, Body); events.push('copy'); return {}; }
    if (command.constructor.name === 'DeleteObjectCommand') { events.push('delete'); objects.delete(key); return {}; }
    const value = objects.get(key); if (!value) throw new Error('Missing object');
    return { ContentLength: value.length, Body: { transformToByteArray: async () => value } };
  } };
  const db = { document: { findMany: async () => documents, findUniqueOrThrow: async ({ where }) => documents.find(document => document.id === where.id),
    updateMany: async ({ where, data }) => { events.push('pointer'); documents.find(document => document.id === where.id).storageKey = data.storageKey; return { count: 1 }; } },
    $transaction: async action => action(db) };
  let manifest = null;
  return { db, storage, events, objects, documents, anonymousStatus: async () => 403,
    loadManifest: async () => manifest, saveManifest: async value => { manifest = structuredClone(value); } };
}
test('all four copies verify before pointer changes; public removal follows persisted private pointers; retry is idempotent', async () => {
  const context = fixtures(); const result = await migrateDocuments(context);
  assert.deepEqual(result, { migrated: 4, publicOriginalsRemoved: 4 });
  assert.deepEqual(context.events.slice(0, 8), ['copy', 'copy', 'copy', 'copy', 'pointer', 'pointer', 'pointer', 'pointer']);
  assert.equal(context.objects.size, 4); assert(context.documents.every(document => document.storageKey.startsWith('private-documents/')));
  await migrateDocuments(context); assert.equal(context.events.filter(event => event === 'delete').length, 4);
});
test('publicly accessible destination stops before any pointer change or source deletion', async () => {
  const context = fixtures(); context.anonymousStatus = async () => 200;
  await assert.rejects(migrateDocuments(context), /publicly accessible/);
  assert(!context.events.includes('pointer')); assert(!context.events.includes('delete'));
});
test('size mismatch retains every existing database pointer and public source', async () => {
  const context = fixtures(); context.documents[0].fileSize += 1;
  await assert.rejects(migrateDocuments(context), /size\/hash mismatch/);
  assert.equal(context.events.length, 0); assert.equal(context.objects.size, 4);
});
