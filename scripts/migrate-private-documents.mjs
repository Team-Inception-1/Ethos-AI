import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
const requireWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const requireRoot = createRequire(new URL('../package.json', import.meta.url));
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = requireWeb('@aws-sdk/client-s3');
const { PrismaClient } = requireRoot('@prisma/client');
const bucket = 'ethos-private-documents';
const primaryHost = 'ep-young-term-axk9zwb2-pooler.c-4.us-east-2.aws.neon.tech';
const manifestDirectory = new URL('../apps/web/.private-documents/', import.meta.url);
const manifestPath = new URL('legacy-migration-20260930.json', manifestDirectory);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export async function verifiedBytes(storage, bucketName, key, expectedHash, expectedSize) {
  const object = await storage.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
  if (!object.Body || (object.ContentLength ?? 0) > 10 * 1024 * 1024) throw new Error('Missing or oversized legacy document; migration stopped.');
  const bytes = Buffer.from(await object.Body.transformToByteArray());
  if (bytes.length !== expectedSize || bytes.length > 10 * 1024 * 1024 || (expectedHash && hash(bytes) !== expectedHash)) {
    throw new Error('Document size/hash mismatch; migration stopped.');
  }
  return bytes;
}

export async function migrateDocuments({ db, storage, anonymousStatus, loadManifest, saveManifest }) {
  let manifest = await loadManifest();
  if (!manifest) {
    const documents = await db.document.findMany({ where: { storageKey: { startsWith: 'documents/' } },
      select: { id: true, ownerId: true, storageKey: true, mimeType: true, fileSize: true } });
    if (documents.length !== 4) throw new Error('The approved four-document migration scope changed; review is required.');
    manifest = documents.map(document => {
      if (document.mimeType !== 'application/pdf' || !/^[a-zA-Z0-9_-]{1,128}$/.test(document.ownerId)) throw new Error('Unexpected document format/owner; migration stopped.');
      return { ...document, oldKey: document.storageKey,
        newKey: `private-documents/${document.ownerId}/${hash(Buffer.from(document.id)).slice(0, 32)}.pdf`, removed: false };
    });
    await saveManifest(manifest);
  }
  for (const entry of manifest) {
    const current = await db.document.findUniqueOrThrow({ where: { id: entry.id } });
    if (current.ownerId !== entry.ownerId || ![entry.oldKey, entry.newKey].includes(current.storageKey)) throw new Error('Document changed during migration; stopping.');
    if (!entry.sha256) {
      const bytes = await verifiedBytes(storage, 'documents', entry.oldKey, null, entry.fileSize);
      if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('Unexpected legacy PDF signature; stopping.');
      entry.sha256 = hash(bytes);
      await storage.send(new PutObjectCommand({ Bucket: bucket, Key: entry.newKey, Body: bytes, ContentType: entry.mimeType }));
      await verifiedBytes(storage, bucket, entry.newKey, entry.sha256, entry.fileSize);
      await saveManifest(manifest);
    } else await verifiedBytes(storage, bucket, entry.newKey, entry.sha256, entry.fileSize);
    if (![401, 403, 404].includes(await anonymousStatus(bucket, entry.newKey))) throw new Error('Private copy is publicly accessible; stopping.');
  }
  // Every private copy is verified before changing any database pointer.
  await db.$transaction(async transaction => {
    for (const entry of manifest) {
      const result = await transaction.document.updateMany({ where: { id: entry.id, ownerId: entry.ownerId,
        storageKey: { in: [entry.oldKey, entry.newKey] } }, data: { storageKey: entry.newKey } });
      if (result.count !== 1) throw new Error('Concurrent document change; all pointer changes rolled back.');
    }
  }, { maxWait: 10000, timeout: 20000 });
  for (const entry of manifest) {
    const current = await db.document.findUniqueOrThrow({ where: { id: entry.id } });
    if (current.storageKey !== entry.newKey) throw new Error('Private pointer was not persisted; public source retained.');
    await verifiedBytes(storage, bucket, entry.newKey, entry.sha256, entry.fileSize);
    if (![401, 403, 404].includes(await anonymousStatus(bucket, entry.newKey))) throw new Error('Private storage access changed; public source retained.');
    if (!entry.removed) {
      await storage.send(new DeleteObjectCommand({ Bucket: 'documents', Key: entry.oldKey }));
      if (![401, 403, 404].includes(await anonymousStatus('documents', entry.oldKey))) throw new Error('Public original remains accessible; review is required.');
      entry.removed = true;
      await saveManifest(manifest);
    }
  }
  return { migrated: manifest.length, publicOriginalsRemoved: manifest.filter(entry => entry.removed).length };
}

async function main() {
  if (process.env.APPROVED_PRIVATE_DOCUMENT_MIGRATION !== 'true') throw new Error('Explicit approved migration flag is required.');
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (url.hostname !== primaryHost || url.pathname !== '/neondb') throw new Error('This migration is scoped to the approved production database.');
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error('S3 configuration is required.');
  const storage = new S3Client({ endpoint, region: process.env.AWS_REGION || 'us-east-2', forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
  const db = new PrismaClient();
  try {
    const result = await migrateDocuments({ db, storage,
      anonymousStatus: async (bucketName, key) => (await fetch(`${endpoint.replace(/\/$/, '')}/${bucketName}/${key.split('/').map(encodeURIComponent).join('/')}`,
        { redirect: 'error', signal: AbortSignal.timeout(15000) })).status,
      loadManifest: async () => { try { return JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } },
      saveManifest: async manifest => { await fs.mkdir(manifestDirectory, { recursive: true }); await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600 }); },
    });
    console.log(JSON.stringify(result));
  } finally { await db.$disconnect(); storage.destroy(); }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
