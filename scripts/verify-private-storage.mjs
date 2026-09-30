import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

if (process.env.VERIFY_PRIVATE_STORAGE !== 'true') throw new Error('Explicit VERIFY_PRIVATE_STORAGE=true is required.');
const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error('S3 configuration is required.');
const bucket = 'ethos-private-documents';
const key = `private-documents/stabilization-fixture/${randomUUID()}.pdf`;
const bytes = Buffer.from('%PDF-1.7\nStabilization storage fixture only.\n%%EOF');
const client = new S3Client({ endpoint, region: process.env.AWS_REGION || 'us-east-2', forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey } });
let uploaded = false;
try {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: 'application/pdf' }));
  uploaded = true;
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!object.Body || !Buffer.from(await object.Body.transformToByteArray()).equals(bytes)) throw new Error('Authenticated storage round trip failed.');
  const anonymous = await fetch(`${endpoint.replace(/\/$/, '')}/${bucket}/${key}`, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (![401, 403, 404].includes(anonymous.status)) throw new Error(`Anonymous object access was not denied: ${anonymous.status}`);
  console.log(`Private storage round trip passed; anonymous access denied (${anonymous.status}).`);
} finally {
  // Remove only this script's uniquely named fixture; never any user object.
  if (uploaded) await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  client.destroy();
}
