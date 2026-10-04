export const applicationStages = ['SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED', 'PAYMENT_PENDING',
  'VISA_PROCESSING', 'VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED'] as const;
export type ApplicationStage = typeof applicationStages[number];
export const stageTransitions: Record<ApplicationStage, readonly ApplicationStage[]> = {
  SUBMITTED: ['UNDER_REVIEW'], UNDER_REVIEW: ['OFFER_RECEIVED'], OFFER_RECEIVED: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['VISA_PROCESSING'], VISA_PROCESSING: ['VISA_APPROVED', 'VISA_REJECTED'],
  VISA_APPROVED: ['COMPLETED'], VISA_REJECTED: [], COMPLETED: [],
};
export interface AgencyDashboardData {
  agency: { id: string; name: string; licenseNo: string; licenseStatus: string; countriesServed: string[] };
  applications: { id: string; student: { id: string; name: string; email: string; phone: string };
    targetUniversity: string; targetProgram: string; targetCountry: string; stage: ApplicationStage;
    intakeSemester: string | null; createdAt: string; heldBdt: number; lastNote: string | null;
    documents: { id: string; fileName: string; type: string }[] }[];
  services: { id: string; serviceName: string; amountBdt: number; whenCharged: string; refundable: boolean; conditions: string | null }[];
  documents: { id: string; fileName: string; type: string; uploadedAt: string }[];
}
export interface BenchmarkView {
  id: string; country: string; countryCode: string; flagEmoji: string; currency: string; exchangeRateBdt: number;
  livingCostMonthlyBdtMin: number; livingCostMonthlyBdtMax: number; blockedAccountOrGicBdt: number;
  visaFeeBdt: number; healthInsuranceYearlyBdt: number; requirementType: string;
  officialGovUrl: string; officialGovSourceTitle: string; keyRequirements: string[]; isVerified: boolean;
  status?: string;
}
export interface FeeSubmissionView {
  id: string; serviceName: string; country: string; amountBdt: number; status: string; adminFeedback?: string | null;
}
