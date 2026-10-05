export const applicationStages = ['SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED', 'PAYMENT_PENDING',
  'VISA_PROCESSING', 'VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED'] as const;
export type ApplicationStage = typeof applicationStages[number];
export const stageTransitions: Record<ApplicationStage, readonly ApplicationStage[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'OFFER_RECEIVED', 'PAYMENT_PENDING', 'VISA_PROCESSING', 'VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED'],
  UNDER_REVIEW: ['OFFER_RECEIVED', 'PAYMENT_PENDING', 'VISA_PROCESSING', 'VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED', 'SUBMITTED'],
  OFFER_RECEIVED: ['PAYMENT_PENDING', 'VISA_PROCESSING', 'VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED', 'UNDER_REVIEW', 'SUBMITTED'],
  PAYMENT_PENDING: ['VISA_PROCESSING', 'VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED', 'OFFER_RECEIVED', 'UNDER_REVIEW', 'SUBMITTED'],
  VISA_PROCESSING: ['VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED', 'PAYMENT_PENDING', 'OFFER_RECEIVED', 'UNDER_REVIEW', 'SUBMITTED'],
  VISA_APPROVED: ['COMPLETED', 'VISA_PROCESSING', 'PAYMENT_PENDING', 'OFFER_RECEIVED', 'UNDER_REVIEW', 'SUBMITTED', 'VISA_REJECTED'],
  VISA_REJECTED: ['VISA_PROCESSING', 'UNDER_REVIEW', 'OFFER_RECEIVED', 'PAYMENT_PENDING', 'VISA_APPROVED', 'COMPLETED', 'SUBMITTED'],
  COMPLETED: ['VISA_APPROVED', 'VISA_PROCESSING', 'PAYMENT_PENDING', 'OFFER_RECEIVED', 'UNDER_REVIEW', 'SUBMITTED', 'VISA_REJECTED'],
};
export interface AgencyPayoutItem {
  id: string;
  milestoneName: string;
  orderIndex: number;
  amountBdt: number;
  status: 'PENDING' | 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  releaseCondition: string;
  releaseRequested: boolean;
  releaseRequestedAt: string | null;
  releaseNote: string | null;
  createdAt: string;
  updatedAt: string;
  releasedAt: string | null;
  heldAt: string | null;
  provider: string;
  providerTxnId: string | null;
  txHash: string | null;
  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  application: {
    id: string;
    targetUniversity: string;
    targetProgram: string;
    targetCountry: string;
    intakeSemester: string | null;
    stage: ApplicationStage;
  };
}

export interface AgencyPayoutsSummary {
  totalReleasedBdt: number;
  totalHeldBdt: number;
  totalPendingAdminBdt: number;
  releasedCount: number;
  heldCount: number;
}

export interface AgencyDashboardData {
  agency: { id: string; name: string; licenseNo: string; licenseStatus: string; countriesServed: string[] };
  applications: { id: string; student: { id: string; name: string; email: string; phone: string };
    targetUniversity: string; targetProgram: string; targetCountry: string; stage: ApplicationStage;
    intakeSemester: string | null; createdAt: string; heldBdt: number; lastNote: string | null;
    documents: { id: string; fileName: string; type: string }[] }[];
  services: { id: string; serviceName: string; amountBdt: number; whenCharged: string; refundable: boolean; conditions: string | null }[];
  documents: { id: string; fileName: string; type: string; uploadedAt: string }[];
  payouts: AgencyPayoutItem[];
  payoutsSummary: AgencyPayoutsSummary;
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
