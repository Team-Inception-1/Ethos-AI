import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { identifier, platformError, success } from '@/lib/platform/http';
import { sameOrigin } from '@/lib/auth/registration';

const publicFields = { id: true, name: true, email: true, phone: true, role: true, isVerified: true,
  avatarUrl: true, createdAt: true } as const;
export async function GET() {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    const rows = await prisma.user.findMany({ select: { ...publicFields,
      studentProfile: { select: { targetCountries: true, targetField: true, budgetRange: true, linkCode: true } },
      agencyProfile: { select: { name: true, licenseNo: true, licenseStatus: true, riskScore: true } },
      _count: { select: { parentLinksAsParent: true, parentLinksAsStudent: true } },
    }, orderBy: { createdAt: 'desc' }, take: 500 });
    const users = rows.map(({ studentProfile, agencyProfile, _count, ...row }) => ({ ...row,
      details: studentProfile ?? (agencyProfile ? { ...agencyProfile, agencyName: agencyProfile.name } : null),
      linkedAccountsCount: _count.parentLinksAsParent + _count.parentLinksAsStudent,
    }));
    return success({ users });
  } catch (error) { return platformError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const { userId, ...data } = z.object({ userId: identifier, isVerified: z.boolean().optional(),
      role: z.enum(['STUDENT', 'PARENT', 'AGENCY', 'ADMIN']).optional(),
    }).refine(value => value.role !== undefined || value.isVerified !== undefined, 'Specify a change.').parse(await request.json());
    if (userId === auth.user.id && data.role && data.role !== 'ADMIN') {
      return apiError('SELF_DEMOTION', 'An administrator cannot remove their own administrator role.', 409);
    }
    const user = await prisma.$transaction(async tx => {
      const updated = await tx.user.update({ where: { id: userId }, data, select: publicFields });
      if (updated.role === 'AGENCY' && data.isVerified !== undefined) {
        const agency = await tx.agency.findUnique({ where: { ownerUserId: userId } });
        if (agency) {
          await tx.agency.update({
            where: { id: agency.id },
            data: { licenseStatus: data.isVerified ? 'VERIFIED' : 'PENDING' },
          });
        } else {
          await tx.agency.create({
            data: {
              ownerUserId: userId,
              name: updated.name,
              licenseNo: 'MOE-BD-' + (new Date().getFullYear()) + '-' + Math.floor(100 + Math.random() * 900),
              licenseStatus: data.isVerified ? 'VERIFIED' : 'PENDING',
              countriesServed: ['CAN', 'GBR', 'USA', 'AUS'],
              description: 'Verified study-abroad consultancy.',
            },
          });
        }
      }
      await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: 'USER_UPDATED',
        entityType: 'User', entityId: userId, details: data } });
      return updated;
    });
    return success({ user, message: 'User updated.' });
  } catch (error) { return platformError(error); }
}
