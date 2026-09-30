import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), create: vi.fn(), application: vi.fn(), upload: vi.fn(), remove: vi.fn(), access: vi.fn(), find: vi.fn(), deleteRow: vi.fn() }));
vi.mock('@/lib/auth/authorization', () => ({ requireUser: mocks.authorize, forbiddenResponse: () => Response.json({ error: { code: 'FORBIDDEN' } }, { status: 403 }) }));
vi.mock('@/lib/prisma', () => ({ prisma: { document: { create: mocks.create, findUnique: mocks.find, delete: mocks.deleteRow }, application: { findFirst: mocks.application } } }));
vi.mock('@/lib/storage', () => ({ uploadDocumentFile: mocks.upload, deleteDocumentFile: mocks.remove }));
vi.mock('@/lib/auth/relationships', () => ({ canAccessDocument: mocks.access }));
import { POST } from '@/app/api/documents/route';
import { DELETE } from '@/app/api/documents/[id]/route';
const context = { params: Promise.resolve({ id: 'doc' }) };
function request(bytes = '%PDF-1.7\n%%EOF', mime = 'application/pdf', origin = 'http://localhost:3000', applicationId?: string) {
  const form = new FormData(); form.set('file', new File([bytes], 'passport.pdf', { type: mime })); form.set('ownerId', 'forged');
  if (applicationId) form.set('applicationId', applicationId);
  return new Request('http://localhost:3000/api/documents', { method: 'POST', headers: { origin }, body: form });
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.authorize.mockResolvedValue({ user: { id: 'student', role: 'STUDENT' }, response: null });
  mocks.upload.mockResolvedValue({ key: 'private-documents/student/key.pdf' }); mocks.create.mockResolvedValue({ id: 'doc' });
  mocks.access.mockResolvedValue(true); mocks.find.mockResolvedValue({ id: 'doc', storageKey: 'private-documents/student/key.pdf' });
});
describe('document upload boundary', () => {
  it('uses only authenticated owner identity and does not claim encryption', async () => {
    expect((await POST(request())).status).toBe(201);
    expect(mocks.upload).toHaveBeenCalledWith(expect.any(Buffer), 'passport.pdf', 'application/pdf', 'student');
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ ownerId: 'student', isEncrypted: false }) });
  });
  it('rejects forged MIME, disallowed types and empty files without storage writes', async () => {
    expect((await POST(request('<script>x</script>'))).status).toBe(415);
    expect((await POST(request('<svg/>', 'image/svg+xml'))).status).toBe(415);
    expect((await POST(request(''))).status).toBe(413); expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('rejects files over 10 MB before storage writes', async () => {
    expect((await POST(request('%PDF-' + 'x'.repeat(10 * 1024 * 1024)))).status).toBe(413); expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('rejects cross-origin and another student application', async () => {
    expect((await POST(request(undefined, undefined, 'https://attacker.test'))).status).toBe(403);
    mocks.application.mockResolvedValue(null);
    expect((await POST(request(undefined, undefined, undefined, 'someone-elses-application'))).status).toBe(403);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('does not save metadata on failed storage', async () => {
    mocks.upload.mockRejectedValue(new Error('Storage unavailable'));
    expect((await POST(request())).status).toBe(503); expect(mocks.create).not.toHaveBeenCalled();
  });
  it('removes only the newly uploaded object if metadata persistence fails', async () => {
    mocks.create.mockRejectedValue(new Error('Database unavailable'));
    expect((await POST(request())).status).toBe(503);
    expect(mocks.remove).toHaveBeenCalledWith('private-documents/student/key.pdf');
  });
  it('denies cross-user deletion and keeps metadata when storage deletion fails', async () => {
    mocks.access.mockResolvedValue(false); expect((await DELETE(request(), context)).status).toBe(403);
    expect(mocks.remove).not.toHaveBeenCalled(); mocks.access.mockResolvedValue(true); mocks.remove.mockRejectedValue(new Error('Storage unavailable'));
    expect((await DELETE(request(), context)).status).toBe(503); expect(mocks.deleteRow).not.toHaveBeenCalled();
  });
});
