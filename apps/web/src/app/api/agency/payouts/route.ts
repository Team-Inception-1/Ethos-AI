import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { platformError, success, toBdt } from '@/lib/platform/http';

export async function GET() {
  try {
    const auth = await requireRole(['AGENCY']);
    if (auth.response) return auth.response;

    const agency = await prisma.agency.findUnique({
      where: { ownerUserId: auth.user.id },
      select: { id: true, name: true, licenseNo: true, licenseStatus: true },
    });
    if (!agency) {
      return success({ payouts: [], payoutsSummary: { totalReleasedBdt: 0, totalHeldBdt: 0, totalPendingAdminBdt: 0, releasedCount: 0, heldCount: 0 } });
    }

    const rawMilestones = await prisma.milestone.findMany({
      where: { application: { agencyId: agency.id } },
      include: {
        application: {
          select: {
            id: true,
            targetUniversity: true,
            targetProgram: true,
            targetCountry: true,
            intakeSemester: true,
            stage: true,
            student: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        ledgerEntries: { orderBy: { timestamp: 'desc' } },
        paymentAttempts: { where: { status: 'VALID' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 300,
    });

    const payouts = rawMilestones.map(m => {
      const releaseLedger = m.ledgerEntries.find(e => e.type === 'RELEASE');
      const holdLedger = m.ledgerEntries.find(e => e.type === 'HOLD');
      const latestLedger = m.ledgerEntries[0];
      const validAttempt = m.paymentAttempts[0];

      return {
        id: m.id,
        milestoneName: m.name,
        orderIndex: m.orderIndex,
        amountBdt: toBdt(m.amountPoisha),
        status: m.status,
        releaseCondition: m.releaseCondition,
        releaseRequested: m.releaseRequested,
        releaseRequestedAt: m.releaseRequestedAt ? m.releaseRequestedAt.toISOString() : null,
        releaseNote: m.releaseNote,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        releasedAt: releaseLedger ? releaseLedger.timestamp.toISOString() : (m.status === 'RELEASED' ? m.updatedAt.toISOString() : null),
        heldAt: holdLedger ? holdLedger.timestamp.toISOString() : (m.status !== 'PENDING' ? m.createdAt.toISOString() : null),
        provider: releaseLedger?.provider ?? holdLedger?.provider ?? validAttempt?.provider ?? 'SSLCOMMERZ',
        providerTxnId: releaseLedger?.providerTxnId ?? holdLedger?.providerTxnId ?? validAttempt?.providerTxnId ?? null,
        txHash: releaseLedger?.txHash ?? holdLedger?.txHash ?? latestLedger?.txHash ?? null,
        student: {
          id: m.application.student.id,
          name: m.application.student.name,
          email: m.application.student.email,
          phone: m.application.student.phone,
        },
        application: {
          id: m.application.id,
          targetUniversity: m.application.targetUniversity,
          targetProgram: m.application.targetProgram,
          targetCountry: m.application.targetCountry,
          intakeSemester: m.application.intakeSemester,
          stage: m.application.stage,
        },
      };
    });

    const payoutsSummary = {
      totalReleasedBdt: payouts.filter(p => p.status === 'RELEASED').reduce((sum, p) => sum + p.amountBdt, 0),
      totalHeldBdt: payouts.filter(p => p.status === 'HELD').reduce((sum, p) => sum + p.amountBdt, 0),
      totalPendingAdminBdt: payouts.filter(p => p.status === 'HELD' && p.releaseRequested).reduce((sum, p) => sum + p.amountBdt, 0),
      releasedCount: payouts.filter(p => p.status === 'RELEASED').length,
      heldCount: payouts.filter(p => p.status === 'HELD').length,
    };

    return success({
      agency,
      payouts,
      payoutsSummary,
    });
  } catch (error) {
    return platformError(error);
  }
}
