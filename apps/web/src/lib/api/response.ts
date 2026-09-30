import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export const apiError = (code: string, message: string, status: number) =>
  NextResponse.json({ error: { code, message } }, { status });

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: {
    code: 'VALIDATION_ERROR', message: 'Check the submitted fields.', fields: error.flatten().fieldErrors,
  } }, { status: 400 });
  if (error instanceof SyntaxError) return apiError('INVALID_JSON', 'Invalid JSON request.', 400);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return apiError('CONFLICT', 'A record with these details already exists.', 409);
  }
  console.error('API request failed:', error instanceof Error ? error.name : 'UnknownError');
  return apiError('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please retry.', 503);
}
