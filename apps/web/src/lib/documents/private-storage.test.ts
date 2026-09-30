import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ send: vi.fn(), write: vi.fn(), mkdir: vi.fn() }));
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class { send = mocks.send; },
  PutObjectCommand: class { constructor(public input: unknown) {} },
  GetObjectCommand: class { constructor(public input: unknown) {} },
  DeleteObjectCommand: class { constructor(public input: unknown) {} },
}));
vi.mock('node:fs', () => ({ promises: { writeFile: mocks.write, mkdir: mocks.mkdir } }));
import { validateDocumentBytes, uploadPrivateDocument, readPrivateDocument, deletePrivateDocument } from './private-storage';
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('AWS_ENDPOINT_URL_S3', 'https://storage.example.test');
  vi.stubEnv('AWS_ACCESS_KEY_ID', 'test-key'); vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'test-secret');
});
describe('private document storage', () => {
  it('requires MIME-specific PDF, JPEG and PNG signatures and bounded nonempty bytes', () => {
    expect(validateDocumentBytes(Buffer.from('%PDF-1.7'), 'application/pdf')).toBe(true);
    expect(validateDocumentBytes(Buffer.from([255, 216, 255]), 'image/jpeg')).toBe(true);
    expect(validateDocumentBytes(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png')).toBe(true);
    expect(validateDocumentBytes(Buffer.from('%PDF-1.7'), 'image/png')).toBe(false);
    expect(validateDocumentBytes(Buffer.from('<svg/>'), 'image/svg+xml')).toBe(false);
    expect(validateDocumentBytes(Buffer.alloc(0), 'application/pdf')).toBe(false);
  });
  it('uses the dedicated private bucket and opaque keys without public URLs or filesystem copies', async () => {
    const result = await uploadPrivateDocument(Buffer.from('%PDF-1.7'), 'application/pdf', 'student');
    expect(result).toMatchObject({ url: '', provider: 'neon-s3' }); expect(result.key).toMatch(/^private-documents\/student\/[a-f0-9-]+\.pdf$/);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ Bucket: 'ethos-private-documents', Key: result.key }) }));
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it('never falls back on S3 failure, even in development', async () => {
    mocks.send.mockRejectedValue(new Error('S3 failure')); vi.stubEnv('ENABLE_LOCAL_PRIVATE_STORAGE', 'true');
    await expect(uploadPrivateDocument(Buffer.from('%PDF-1.7'), 'application/pdf', 'student')).rejects.toThrow('S3 failure'); expect(mocks.write).not.toHaveBeenCalled();
  });
  it('refuses unconfigured production storage even if local mode is enabled', async () => {
    vi.stubEnv('AWS_ACCESS_KEY_ID', ''); vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('ENABLE_LOCAL_PRIVATE_STORAGE', 'true');
    await expect(uploadPrivateDocument(Buffer.from('%PDF-1.7'), 'application/pdf', 'student')).rejects.toThrow('local storage is disabled');
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it('rejects traversal and propagates delete failures', async () => {
    await expect(readPrivateDocument('private-documents/../key.pdf')).rejects.toThrow('Invalid private');
    mocks.send.mockRejectedValue(new Error('Denied'));
    await expect(deletePrivateDocument('private-documents/student/abcdef.pdf')).rejects.toThrow('Denied');
  });
  it('reads bytes only from the private bucket and bounds the downloaded body', async () => {
    mocks.send.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1]) }, ContentLength: 1 });
    expect(await readPrivateDocument('private-documents/student/abcdef.pdf')).toEqual(new Uint8Array([1]));
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ Bucket: 'ethos-private-documents' }) }));
    mocks.send.mockResolvedValue({ ContentLength: 11 * 1024 * 1024, Body: {} });
    await expect(readPrivateDocument('private-documents/student/abcdef.pdf')).rejects.toThrow('Document unavailable');
  });
});
