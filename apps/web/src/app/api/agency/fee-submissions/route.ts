import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { feeDto } from '@/lib/platform/fees';
import { moneyBdt, parseFeeStatus, platformError, publicUrl, shortText, success, toPoisha } from '@/lib/platform/http';
import { sameOrigin } from '@/lib/auth/registration';

const submissionSchema = z.object({
  country: shortText, serviceName: shortText, amountBdt: moneyBdt,
  whenCharged: shortText, refundable: z.boolean().default(true),
  refundPolicy: z.string().trim().min(1).max(10000), proofDocumentUrls: z.array(publicUrl).min(1).max(10),
});
export async function GET(request: Request) {
  try {
    const auth = await requireRole(['AGENCY']);
    if (auth.response) return auth.response;
    let agency = await prisma.agency.findUnique({ where: { ownerUserId: auth.user.id }, select: { id: true } });
    if (!agency) {
      const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { name: true } });
      agency = await prisma.agency.create({
        data: {
          ownerUserId: auth.user.id,
          name: user?.name || 'Agency Workspace',
          licenseNo: 'MOE-BD-' + (new Date().getFullYear()) + '-' + Math.floor(100 + Math.random() * 900),
          licenseStatus: auth.user.isVerified ? 'VERIFIED' : 'PENDING',
          countriesServed: ['CAN', 'GBR', 'USA', 'AUS'],
          rating: 0,
          reviewCount: 0,
          successRate: 0,
        },
        select: { id: true },
      });
    }
    const status = parseFeeStatus(new URL(request.url).searchParams.get('status'));
    const rows = await prisma.agencyFeeSubmission.findMany({ where: { agencyId: agency.id, status },
      include: { agency: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
    const submissions = rows.map(feeDto);
    return success({ submissions, count: submissions.length });
  } catch (error) { return platformError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireRole(['AGENCY']);
    if (auth.response) return auth.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const input = submissionSchema.parse(await request.json());
    let agency = await prisma.agency.findUnique({ where: { ownerUserId: auth.user.id }, select: { id: true } });
    if (!agency) {
      const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { name: true } });
      agency = await prisma.agency.create({
        data: {
          ownerUserId: auth.user.id,
          name: user?.name || 'Agency Workspace',
          licenseNo: 'MOE-BD-' + (new Date().getFullYear()) + '-' + Math.floor(100 + Math.random() * 900),
          licenseStatus: auth.user.isVerified ? 'VERIFIED' : 'PENDING',
          countriesServed: ['CAN', 'GBR', 'USA', 'AUS'],
          rating: 0,
          reviewCount: 0,
          successRate: 0,
        },
        select: { id: true },
      });
    }
    const { amountBdt, ...data } = input;
    const row = await prisma.agencyFeeSubmission.create({ data: { ...data, agencyId: agency.id,
      amountPoisha: toPoisha(amountBdt), status: 'PENDING' }, include: { agency: { select: { name: true } } } });
    return success({ submission: feeDto(row), message: 'Fee package submitted for review.' }, 201);
  } catch (error) { return platformError(error); }
}
