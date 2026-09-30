import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { benchmarkData, benchmarkDto, benchmarkInput } from '@/lib/platform/provenance';
import { identifier, PlatformConflict, platformError, shortText, success } from '@/lib/platform/http';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const countryParam = new URL(request.url).searchParams.get('country');
    const country = countryParam ? shortText.parse(countryParam) : undefined;
    const visibility = user?.role === 'ADMIN' ? {} : { isVerified: true };
    if (country) {
      const row = await prisma.countryCostBenchmark.findFirst({ where: { ...visibility, OR: [
        { country: { equals: country, mode: 'insensitive' } }, { countryCode: { equals: country, mode: 'insensitive' } },
      ] } });
      if (!row) return apiError('NOT_FOUND', 'Published country benchmark not found.', 404);
      return success({ benchmark: benchmarkDto(row) });
    }
    const rows = await prisma.countryCostBenchmark.findMany({ where: visibility, orderBy: { country: 'asc' }, take: 300 });
    const pending = user?.role === 'ADMIN' ? await prisma.countryBenchmarkSubmission.findMany({
      where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' }, take: 300,
    }) : [];
    const benchmarks = [ ...rows.map(benchmarkDto), ...pending.map(proposal => ({
      ...benchmarkInput.parse(proposal.payload), id: proposal.id, isVerified: false,
      verifiedByAdminId: null, lastAuditedAt: proposal.createdAt, createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt, isProposal: true, submittedById: proposal.submittedById,
    })) ];
    return success({ benchmarks, count: benchmarks.length });
  } catch (error) { return platformError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireRole(['AGENCY', 'ADMIN']);
    if (auth.response) return auth.response;
    const input = benchmarkInput.parse(await request.json());
    // Proposals preserve the published benchmark until an administrator approves.
    const proposal = await prisma.$transaction(async tx => {
      const saved = await tx.countryBenchmarkSubmission.create({ data: {
        country: input.country, payload: input, submittedById: auth.user.id, status: 'PENDING',
      } });
      await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: 'BENCHMARK_SUBMITTED',
        entityType: 'CountryBenchmarkSubmission', entityId: saved.id } });
      return saved;
    });
    return success({ benchmark: { ...input, id: proposal.id, isVerified: false, isProposal: true,
      verifiedByAdminId: null, lastAuditedAt: proposal.createdAt }, message: 'Benchmark submitted for verification.' }, 201);
  } catch (error) { return platformError(error); }
}
export async function PATCH(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    const input = z.object({ id: identifier, isVerified: z.boolean() }).parse(await request.json());
    const row = await prisma.$transaction(async tx => {
      const proposal = await tx.countryBenchmarkSubmission.findUnique({ where: { id: input.id } });
      if (proposal) {
        const claimed = await tx.countryBenchmarkSubmission.updateMany({ where: { id: input.id, status: 'PENDING' },
          data: { status: input.isVerified ? 'VERIFIED' : 'REJECTED', reviewedByAdminId: auth.user.id, reviewedAt: new Date() } });
        if (!claimed.count) throw new PlatformConflict('This proposal has already been reviewed.');
        const payload = benchmarkInput.parse(proposal.payload);
        let published = null;
        if (input.isVerified) {
          const data = { ...benchmarkData(payload), isVerified: true, verifiedByAdminId: auth.user.id, lastAuditedAt: new Date() };
          const existing = await tx.countryCostBenchmark.findFirst({ where: { country: { equals: payload.country, mode: 'insensitive' } } });
          published = existing ? await tx.countryCostBenchmark.update({ where: { id: existing.id }, data })
            : await tx.countryCostBenchmark.create({ data });
        }
        await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: 'BENCHMARK_PROPOSAL_REVIEWED',
          entityType: 'CountryBenchmarkSubmission', entityId: input.id, details: { isVerified: input.isVerified,
            publishedId: published?.id ?? null } } });
        return published ? benchmarkDto(published) : { ...payload, id: proposal.id, isVerified: false, status: 'REJECTED' };
      }
      const saved = await tx.countryCostBenchmark.update({ where: { id: input.id }, data: {
        isVerified: input.isVerified, verifiedByAdminId: auth.user.id, lastAuditedAt: new Date(),
      } });
      await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: 'BENCHMARK_REVIEWED',
        entityType: 'CountryCostBenchmark', entityId: saved.id, details: { isVerified: input.isVerified } } });
      return benchmarkDto(saved);
    });
    return success({ benchmark: row, message: input.isVerified ? 'Benchmark published.' : 'Benchmark rejected or verification revoked.' });
  } catch (error) { return platformError(error); }
}
