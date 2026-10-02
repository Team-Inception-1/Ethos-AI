import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError, handleApiError } from '@/lib/api/response';

const taskSchema = z.object({
  taskKey: z.string().min(1).max(200),
  completed: z.boolean().default(true),
});

export async function GET() {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;

  try {
    const tasks = await prisma.counselorRoadmapTask.findMany({
      where: { userId: authorization.user.id },
      select: { taskKey: true, completedAt: true },
    });

    return Response.json(
      {
        completedTasks: tasks.map((t) => t.taskKey),
        tasks: tasks.map((t) => ({ taskKey: t.taskKey, completedAt: t.completedAt.toISOString() })),
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);

  try {
    const body = taskSchema.parse(await request.json());

    if (body.completed) {
      await prisma.counselorRoadmapTask.upsert({
        where: {
          userId_taskKey: {
            userId: authorization.user.id,
            taskKey: body.taskKey,
          },
        },
        update: {},
        create: {
          userId: authorization.user.id,
          taskKey: body.taskKey,
        },
      });
    } else {
      await prisma.counselorRoadmapTask.deleteMany({
        where: {
          userId: authorization.user.id,
          taskKey: body.taskKey,
        },
      });
    }

    const updated = await prisma.counselorRoadmapTask.findMany({
      where: { userId: authorization.user.id },
      select: { taskKey: true },
    });

    return Response.json({
      success: true,
      completedTasks: updated.map((t) => t.taskKey),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
