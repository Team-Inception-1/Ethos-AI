import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { platformError, success, toBdt } from '@/lib/platform/http';

export async function GET() {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    const [agencies, users, milestones, alerts, releases] = await prisma.$transaction([
      prisma.agency.groupBy({ by: ['licenseStatus'], orderBy: { licenseStatus: 'asc' }, _count: { _all: true } }),
      prisma.user.groupBy({ by: ['role'], orderBy: { role: 'asc' }, _count: { _all: true } }),
      prisma.milestone.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true }, _sum: { amountPoisha: true } }),
      prisma.scamAlert.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
      prisma.milestone.aggregate({ where: { status: 'HELD', releaseRequested: true }, _count: { _all: true }, _sum: { amountPoisha: true } }),
    ]);
    const groupedCount = (row: { _count?: true | { _all?: number } } | undefined) =>
      typeof row?._count === 'object' ? row._count._all ?? 0 : 0;
    const agencyCount = (status: string) => groupedCount(agencies.find(row => row.licenseStatus === status));
    const userCount = (role: string) => groupedCount(users.find(row => row.role === role));
    const amount = (status: string) => toBdt(milestones.find(row => row.status === status)?._sum?.amountPoisha ?? BigInt(0));
    const disputedBDT = amount('DISPUTED');
    const totalSecuredBDT = amount('HELD') + amount('RELEASED') + disputedBDT;
    const format = (value: number) => `৳${value.toLocaleString('en-IN')}`;
    const pendingReleaseBDT = toBdt(releases._sum.amountPoisha ?? BigInt(0));
    return success({ stats: {
      agencies: { total: agencies.reduce((sum, row) => sum + groupedCount(row), 0), verified: agencyCount('VERIFIED'),
        pending: agencyCount('PENDING'), rejected: agencyCount('REJECTED') },
      users: { total: users.reduce((sum, row) => sum + groupedCount(row), 0), students: userCount('STUDENT'),
        parents: userCount('PARENT'), agencies: userCount('AGENCY'), admins: userCount('ADMIN') },
      disputes: { activeCount: groupedCount(milestones.find(row => row.status === 'DISPUTED')),
        disputedBDT, disputedFormatted: format(disputedBDT) },
      escrow: { held: amount('HELD'), released: amount('RELEASED'), pending: amount('PENDING'),
        totalSecuredBDT, totalSecuredFormatted: format(totalSecuredBDT) },
      escrowReleases: { pendingCount: releases._count._all, pendingBDT: pendingReleaseBDT,
        pendingFormatted: format(pendingReleaseBDT) },
      scamAlerts: { totalCount: alerts.reduce((sum, row) => sum + groupedCount(row), 0),
        pendingCount: alerts.filter(row => ['PENDING_REVIEW', 'FLAGGED'].includes(row.status)).reduce((sum, row) => sum + groupedCount(row), 0) },
    }, serverTime: new Date().toISOString() });
  } catch (error) { return platformError(error); }
}
