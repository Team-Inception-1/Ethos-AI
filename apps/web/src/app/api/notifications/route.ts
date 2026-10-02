import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { apiError, handleApiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';

function formatRelativeTime(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDefaultLink(entityType: string | null, entityId: string | null, role: string): string {
  if (entityId && entityId.startsWith('/')) return entityId;
  if (entityType === 'DOCUMENT') return '/dashboard/documents';
  if (entityType === 'ESCROW' || entityType === 'PAYMENT') return '/dashboard/payments';
  if (entityType === 'COMMUNITY') return '/dashboard/community';
  if (entityType === 'APPLICATION') return entityId ? `/dashboard/applications/${entityId}` : '/dashboard/applications';
  if (entityType === 'DISPUTE') return role === 'ADMIN' ? '/admin#disputes' : '/dashboard/payments';
  if (role === 'AGENCY') return '/agency/dashboard';
  if (role === 'ADMIN') return '/admin';
  return '/dashboard';
}

function getInitialNotificationsForRole(role: string) {
  if (role === 'AGENCY') {
    return [
      {
        type: 'AGENCY',
        title: 'New Student Inquiry',
        message: 'Inquiries received regarding destination universities and intake deadlines.',
        entityType: 'CHAT',
        entityId: '/agency/chat',
      },
      {
        type: 'VERIFICATION',
        title: 'Licensing Verification',
        message: 'Maintain verified agency badge by keeping MOE licensing info up to date.',
        entityType: 'AGENCY',
        entityId: '/agency/dashboard',
      },
      {
        type: 'ESCROW',
        title: 'Escrow Milestone Vaults Active',
        message: 'Student milestone deposits are securely tracked in the cryptographic ledger.',
        entityType: 'ESCROW',
        entityId: '/agency/dashboard',
      },
    ];
  }
  if (role === 'ADMIN') {
    return [
      {
        type: 'DISPUTE',
        title: 'Dispute Docket Review',
        message: 'Platform escrow dispute resolution panel is operational.',
        entityType: 'DISPUTE',
        entityId: '/admin#disputes',
      },
      {
        type: 'AUDIT',
        title: 'Agency Audit Dossier',
        message: 'Review newly submitted consultancy licensing credentials.',
        entityType: 'AUDIT',
        entityId: '/admin#agencies',
      },
      {
        type: 'SCAM',
        title: 'Scam Alert Broadcast',
        message: 'Verify alerts to protect students from predatory consultancies.',
        entityType: 'SCAM',
        entityId: '/admin#scam-alerts',
      },
    ];
  }
  return [
    {
      type: 'DOCUMENT',
      title: 'Offer Letter Verification Ready',
      message: 'Upload university acceptance letters to scan for forgery and credential authenticity.',
      entityType: 'DOCUMENT',
      entityId: '/dashboard/documents',
    },
    {
      type: 'ESCROW',
      title: 'Milestone Escrow Protection',
      message: 'Deposit funds into protected milestone vaults with verified release conditions.',
      entityType: 'ESCROW',
      entityId: '/dashboard/payments',
    },
    {
      type: 'COMMUNITY',
      title: 'International Student Community',
      message: 'Connect with verified Bangladeshi students studying in Canada, UK, USA, and Germany.',
      entityType: 'COMMUNITY',
      entityId: '/dashboard/community',
    },
  ];
}

export async function GET() {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const userId = authorization.user.id;
    const role = authorization.user.role;

    let items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Auto-seed initial domain notifications if empty for this user
    if (items.length === 0) {
      const defaults = getInitialNotificationsForRole(role);
      await prisma.notification.createMany({
        data: defaults.map((d) => ({
          userId,
          type: d.type,
          title: d.title,
          message: d.message,
          entityType: d.entityType,
          entityId: d.entityId,
        })),
      });
      items = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    const notifications = items.map((item) => ({
      id: item.id,
      title: item.title,
      desc: item.message,
      type: item.type,
      time: formatRelativeTime(item.createdAt),
      link: getDefaultLink(item.entityType, item.entityId, role),
      read: item.readAt !== null,
      createdAt: item.createdAt.toISOString(),
    }));

    const unreadCount = items.filter((i) => i.readAt === null).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('mark_read'),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal('mark_all_read'),
  }),
  z.object({
    action: z.literal('create'),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(2000),
    type: z.string().default('SYSTEM'),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
  }),
]);

export async function POST(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);

    const body = updateSchema.parse(await request.json());
    const userId = authorization.user.id;

    if (body.action === 'mark_read') {
      await prisma.notification.updateMany({
        where: { id: body.id, userId },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ success: true, id: body.id });
    }

    if (body.action === 'mark_all_read') {
      const result = await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ success: true, markedCount: result.count });
    }

    if (body.action === 'create') {
      const created = await prisma.notification.create({
        data: {
          userId,
          title: body.title,
          message: body.message,
          type: body.type,
          entityType: body.entityType ?? null,
          entityId: body.entityId ?? null,
        },
      });
      return NextResponse.json({ success: true, notification: created });
    }

    return apiError('BAD_REQUEST', 'Unsupported notification action.', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
