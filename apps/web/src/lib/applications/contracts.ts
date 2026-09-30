import { z } from 'zod';

export const applicationStageSchema = z.enum(['SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED', 'PAYMENT_PENDING',
  'VISA_PROCESSING', 'VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED']);
export const applicationSchema = z.object({
  id: z.string(), targetCountry: z.string(), targetUniversity: z.string(), targetProgram: z.string(),
  intakeSemester: z.string().nullable(), stage: applicationStageSchema, createdAt: z.string(), updatedAt: z.string(),
  agency: z.object({ id: z.string(), name: z.string() }), student: z.object({ id: z.string(), name: z.string() }),
  documentCount: z.number(), milestoneCount: z.number(),
});
export const applicationListSchema = z.object({ applications: z.array(applicationSchema), total: z.number(),
  page: z.number(), pageSize: z.number(), summary: z.object({ activeApplications: z.number(), documentCount: z.number(), heldPoisha: z.string() }),
});
export const applicationDetailSchema = z.object({ application: applicationSchema.extend({
  stageEvents: z.array(z.object({ id: z.string(), stage: applicationStageSchema, actorRole: z.string(),
    actor: z.object({ name: z.string() }), note: z.string().nullable(), timestamp: z.string() })),
  documents: z.array(z.object({ id: z.string(), fileName: z.string(), fileSize: z.number(), mimeType: z.string(), uploadedAt: z.string() })),
  milestones: z.array(z.object({ id: z.string(), name: z.string(), amountPoisha: z.string(), releaseCondition: z.string(),
    status: z.enum(['PENDING', 'HELD', 'DISPUTED', 'RELEASED', 'REFUNDED']), dueDate: z.string().nullable() })),
  chatThread: z.object({ id: z.string() }).nullable(),
}) });
export type ApplicationItem = z.infer<typeof applicationSchema>;
export function stageLabel(stage: string) { return stage.toLowerCase().split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' '); }
