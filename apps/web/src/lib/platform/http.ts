import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { apiError, handleApiError } from '@/lib/api/response';

export const identifier = z.string().trim().min(1).max(200);
export const shortText = z.string().trim().min(1).max(500);
export const moneyBdt = z.number().finite().nonnegative().max(1_000_000_000).refine(
  value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
  'Amounts must have at most two decimal places.',
);
export const publicUrl = z.url().max(2048).refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'Use an HTTPS URL without credentials.');

export function success<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ success: true, data, ...data }, { status });
}
export class PlatformConflict extends Error {}
export function platformError(error: unknown) {
  if (error instanceof PlatformConflict) return apiError('CONFLICT', error.message, 409);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    return apiError('CONFLICT', 'Another request changed this record. Refresh and retry.', 409);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return apiError('NOT_FOUND', 'The requested record was not found.', 404);
  }
  return handleApiError(error);
}
export const toPoisha = (value: number) => BigInt(Math.round(value * 100));
export function toBdt(value: bigint) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Amount exceeds supported display precision.');
  }
  return Number(value) / 100;
}
export const feeStatus = z.enum(['PENDING', 'APPROVED', 'VERIFIED', 'REJECTED', 'FLAGGED']);
export function parseFeeStatus(value: string | null) {
  if (!value) return undefined;
  const status = feeStatus.parse(value);
  return status === 'APPROVED' ? 'VERIFIED' : status;
}
