import type { CountryCostBenchmark, UniversityCourseCatalog } from '@prisma/client';
import { z } from 'zod';
import { moneyBdt, publicUrl, shortText, toBdt, toPoisha } from './http';

export const benchmarkInput = z.object({
  country: shortText, countryCode: z.string().trim().regex(/^[A-Z]{2,3}$/), flagEmoji: z.string().max(20),
  currency: z.string().trim().regex(/^[A-Z]{3}$/), exchangeRateBdt: z.number().finite().positive().max(1_000_000),
  livingCostMonthlyBdtMin: moneyBdt, livingCostMonthlyBdtMax: moneyBdt, blockedAccountOrGicBdt: moneyBdt,
  visaFeeBdt: moneyBdt, healthInsuranceYearlyBdt: moneyBdt,
  requirementType: z.enum(['BLOCKED_ACCOUNT', 'GIC', 'MAINTENANCE_FUNDS', 'BANK_SOLVENCY']),
  officialGovUrl: publicUrl, officialGovSourceTitle: shortText,
  keyRequirements: z.array(z.string().trim().min(1).max(2000)).max(30).default([]),
}).refine(value => value.livingCostMonthlyBdtMin <= value.livingCostMonthlyBdtMax,
  'Minimum living cost cannot exceed maximum.');

export function benchmarkData(input: z.infer<typeof benchmarkInput>) {
  const { livingCostMonthlyBdtMin, livingCostMonthlyBdtMax, blockedAccountOrGicBdt,
    visaFeeBdt, healthInsuranceYearlyBdt, ...rest } = input;
  return { ...rest, livingCostMonthlyPoishaMin: toPoisha(livingCostMonthlyBdtMin),
    livingCostMonthlyPoishaMax: toPoisha(livingCostMonthlyBdtMax), blockedAccountOrGicPoisha: toPoisha(blockedAccountOrGicBdt),
    visaFeePoisha: toPoisha(visaFeeBdt), healthInsuranceYearlyPoisha: toPoisha(healthInsuranceYearlyBdt) };
}

export function benchmarkDto(row: CountryCostBenchmark) {
  const { livingCostMonthlyPoishaMin, livingCostMonthlyPoishaMax, blockedAccountOrGicPoisha,
    visaFeePoisha, healthInsuranceYearlyPoisha, ...rest } = row;
  return { ...rest, livingCostMonthlyBdtMin: toBdt(livingCostMonthlyPoishaMin),
    livingCostMonthlyBdtMax: toBdt(livingCostMonthlyPoishaMax), blockedAccountOrGicBdt: toBdt(blockedAccountOrGicPoisha),
    visaFeeBdt: toBdt(visaFeePoisha), healthInsuranceYearlyBdt: toBdt(healthInsuranceYearlyPoisha) };
}
export function catalogDto(row: UniversityCourseCatalog & { benchmark?: { countryCode: string } | null }) {
  const { annualTuitionPoisha, benchmark, ...rest } = row;
  return { ...rest, annualTuitionBdt: toBdt(annualTuitionPoisha), countryCode: benchmark?.countryCode ?? '' };
}
