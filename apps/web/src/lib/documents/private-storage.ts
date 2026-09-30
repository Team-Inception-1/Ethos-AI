import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const PRIVATE_DOCUMENT_BUCKET = 'ethos-private-documents';
const prefix = 'private-documents/';
const extensions: Record<string, string> = {
  'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png',
};

export function validDocumentMime(mime: string): boolean { return Object.hasOwn(extensions, mime); }

export function validateDocumentBytes(bytes: Uint8Array, mime: string): boolean {
  if (!validDocumentMime(mime) || bytes.length === 0 || bytes.length > MAX_DOCUMENT_BYTES) return false;
  if (mime === 'application/pdf') return Buffer.from(bytes.subarray(0, 5)).toString('ascii') === '%PDF-';
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.length >= 8 && Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}

function client(): S3Client | null {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({ endpoint, region: process.env.AWS_REGION || 'us-east-2', forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey } });
}

function localPath(key: string): string {
  if (!/^private-documents\/[a-zA-Z0-9_-]{1,128}\/[a-f0-9-]+\.(pdf|jpg|png)$/.test(key)) throw new Error('Invalid private document key.');
  return path.join(process.cwd(), '.private-documents', ...key.split('/').slice(1));
}

function requireLocalStorage(): void {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_LOCAL_PRIVATE_STORAGE !== 'true') {
    throw new Error('Private object storage is unavailable; local storage is disabled.');
  }
}

export async function uploadPrivateDocument(buffer: Buffer, mime: string, ownerId: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(ownerId) || !validateDocumentBytes(buffer, mime)) throw new Error('Invalid document.');
  const key = `${prefix}${ownerId}/${randomUUID()}.${extensions[mime]}`;
  const s3 = client();
  if (s3) {
    // Never downgrade an S3 failure into public or process-local persistence.
    await s3.send(new PutObjectCommand({ Bucket: PRIVATE_DOCUMENT_BUCKET, Key: key, Body: buffer, ContentType: mime }));
    return { key, url: '', sizeBytes: buffer.length, provider: 'neon-s3' as const };
  }
  requireLocalStorage();
  const destination = localPath(key);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, buffer, { flag: 'wx', mode: 0o600 });
  return { key, url: '', sizeBytes: buffer.length, provider: 'local' as const };
}

export async function readPrivateDocument(key: string): Promise<Uint8Array> {
  const destination = localPath(key);
  const s3 = client();
  if (s3) {
    const object = await s3.send(new GetObjectCommand({ Bucket: PRIVATE_DOCUMENT_BUCKET, Key: key }));
    if (!object.Body || (object.ContentLength ?? 0) > MAX_DOCUMENT_BYTES) throw new Error('Document unavailable.');
    const bytes = await object.Body.transformToByteArray();
    if (bytes.length > MAX_DOCUMENT_BYTES) throw new Error('Document too large.');
    return bytes;
  }
  requireLocalStorage();
  if ((await fs.stat(destination)).size > MAX_DOCUMENT_BYTES) throw new Error('Document too large.');
  return new Uint8Array(await fs.readFile(destination));
}

export async function deletePrivateDocument(key: string): Promise<boolean> {
  const destination = localPath(key);
  const s3 = client();
  if (s3) await s3.send(new DeleteObjectCommand({ Bucket: PRIVATE_DOCUMENT_BUCKET, Key: key }));
  else { requireLocalStorage(); await fs.rm(destination, { force: true }); }
  return true;
}
