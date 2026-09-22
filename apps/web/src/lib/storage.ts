import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export interface StorageUploadResult {
  key: string;
  url: string;
  sizeBytes: number;
  provider: 'neon-s3' | 'local';
}

/**
 * Returns a configured S3 client for Neon Object Storage if environment variables are present.
 * Neon Object Storage requires path-style addressing (`forcePathStyle: true`) and SigV4.
 */
function getS3Client(): S3Client | null {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-2';

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

/**
 * Storage adapter for Ethos AI.
 * Uploads to Neon S3 Object Storage bucket 'documents' with seamless local fallback.
 */
export async function uploadDocumentFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  ownerId: string = 'usr-student-01'
): Promise<StorageUploadResult> {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectKey = `documents/${ownerId}/${timestamp}_${sanitizedName}`;

  // 1. Ensure local copy in public/uploads for instant local demo preview/offline fallback
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFilePath = path.join(uploadsDir, `${timestamp}_${sanitizedName}`);
  fs.writeFileSync(localFilePath, buffer);
  const localUrl = `/uploads/${timestamp}_${sanitizedName}`;

  // 2. Upload to Neon Object Storage
  const s3 = getS3Client();
  const bucketName = 'documents';

  if (s3) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream',
      });
      await s3.send(command);
      console.log(`[Neon Object Storage] Successfully uploaded ${fileName} to bucket ${bucketName} (key: ${objectKey})`);

      const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, '');
      const s3Url = `${endpoint}/${bucketName}/${objectKey}`;

      return {
        key: objectKey,
        url: s3Url,
        sizeBytes: buffer.length,
        provider: 'neon-s3',
      };
    } catch (e) {
      console.warn('[Neon Object Storage] S3 upload error, falling back to local file storage:', e);
    }
  }

  return {
    key: objectKey,
    url: localUrl,
    sizeBytes: buffer.length,
    provider: 'local',
  };
}

/**
 * Deletes an object from Neon Object Storage and local storage.
 */
export async function deleteDocumentFile(storageKey: string): Promise<boolean> {
  const s3 = getS3Client();
  if (s3 && storageKey.startsWith('documents/')) {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: 'documents',
          Key: storageKey,
        })
      );
      console.log(`[Neon Object Storage] Deleted object ${storageKey}`);
    } catch (e) {
      console.warn('[Neon Object Storage] Could not delete from S3:', e);
    }
  }

  // Remove local file if present
  try {
    const filename = path.basename(storageKey);
    const localFilePath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  } catch {
    // Ignore local deletion error
  }

  return true;
}

/**
 * Uploads a profile avatar photo to Neon Object Storage.
 * Stores under `avatars/${userId}/${timestamp}_${fileName}`.
 */
export async function uploadAvatarFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string = 'usr-current'
): Promise<StorageUploadResult> {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectKey = `avatars/${userId}/${timestamp}_${sanitizedName}`;

  // 1. Ensure local copy in public/uploads/avatars for offline/fallback access
  const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  const localFilePath = path.join(avatarsDir, `${timestamp}_${sanitizedName}`);
  fs.writeFileSync(localFilePath, buffer);
  const localUrl = `/uploads/avatars/${timestamp}_${sanitizedName}`;

  // 2. Upload to Neon Object Storage bucket 'documents' (public_read)
  const s3 = getS3Client();
  const bucketName = 'documents';

  if (s3) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType || 'image/jpeg',
      });
      await s3.send(command);
      console.log(`[Neon Object Storage] Successfully uploaded avatar for ${userId} (key: ${objectKey})`);

      const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, '');
      const s3Url = `${endpoint}/${bucketName}/${objectKey}`;

      return {
        key: objectKey,
        url: s3Url,
        sizeBytes: buffer.length,
        provider: 'neon-s3',
      };
    } catch (e) {
      console.warn('[Neon Object Storage] Avatar S3 upload error, using local storage fallback:', e);
    }
  }

  return {
    key: objectKey,
    url: localUrl,
    sizeBytes: buffer.length,
    provider: 'local',
  };
}
