import type { AgencyFeeSubmission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PlatformConflict, toBdt } from './http';

export function feeDto(submission: AgencyFeeSubmission & { agency: { name: string } }) {
  const { amountPoisha, agency, ...rest } = submission;
  return { ...rest, agencyName: agency.name, amountBdt: toBdt(amountPoisha),
    status: submission.status === 'VERIFIED' ? 'APPROVED' : submission.status,
    submittedAt: submission.createdAt };
}
export async function reviewFee(id: string, action: 'APPROVED' | 'REJECTED', feedback: string, actorId: string) {
  return prisma.$transaction(async tx => {
    const claimed = await tx.agencyFeeSubmission.updateMany({ where: { id, status: 'PENDING' }, data: {
      status: action === 'APPROVED' ? 'VERIFIED' : 'REJECTED', adminFeedback: feedback,
      reviewedAt: new Date(), reviewedByAdminId: actorId,
    } });
    if (!claimed.count) throw new PlatformConflict('The submission is missing or has already been reviewed.');
    const submission = await tx.agencyFeeSubmission.findUniqueOrThrow({ where: { id },
      include: { agency: { select: { name: true } } } });
    if (action === 'APPROVED') {
      const pricing = await tx.agencyPricing.findFirst({ where: { agencyId: submission.agencyId,
        serviceName: { equals: submission.serviceName, mode: 'insensitive' } } });
      const data = { serviceName: submission.serviceName, amountPoisha: submission.amountPoisha,
        whenCharged: submission.whenCharged, refundable: submission.refundable, conditions: submission.refundPolicy };
      if (pricing) await tx.agencyPricing.update({ where: { id: pricing.id }, data });
      else await tx.agencyPricing.create({ data: { ...data, agencyId: submission.agencyId } });
    }
    await tx.governanceAudit.create({ data: { actorId, action: `FEE_${action}`, entityType: 'AgencyFeeSubmission',
      entityId: id, details: { feedback } } });
    return feeDto(submission);
  }, { isolationLevel: 'Serializable' });
}
