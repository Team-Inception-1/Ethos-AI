-- AlterTable
ALTER TABLE "CountryCostBenchmark" ADD COLUMN     "keyRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerTxnId" TEXT NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScamAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "agencyId" TEXT,
    "agencyName" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "evidenceSummary" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionTaken" TEXT,
    "adminNote" TEXT,
    "resolvedByAdminId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScamAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryBenchmarkSubmission" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "ProvenanceStatus" NOT NULL DEFAULT 'PENDING',
    "submittedById" TEXT NOT NULL,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryBenchmarkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceAudit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyRiskState" (
    "agencyId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyRiskState_pkey" PRIMARY KEY ("agencyId")
);

-- CreateTable
CREATE TABLE "AgencyRiskEvent" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyRiskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_providerTxnId_key" ON "PaymentAttempt"("providerTxnId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_milestoneId_status_idx" ON "PaymentAttempt"("milestoneId", "status");

-- CreateIndex
CREATE INDEX "ScamAlert_status_idx" ON "ScamAlert"("status");

-- CreateIndex
CREATE INDEX "ScamAlert_agencyId_idx" ON "ScamAlert"("agencyId");

-- CreateIndex
CREATE INDEX "CountryBenchmarkSubmission_status_idx" ON "CountryBenchmarkSubmission"("status");

-- CreateIndex
CREATE INDEX "CountryBenchmarkSubmission_country_idx" ON "CountryBenchmarkSubmission"("country");

-- CreateIndex
CREATE INDEX "GovernanceAudit_entityType_entityId_idx" ON "GovernanceAudit"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "GovernanceAudit_actorId_idx" ON "GovernanceAudit"("actorId");

-- CreateIndex
CREATE INDEX "AgencyRiskEvent_agencyId_occurredAt_idx" ON "AgencyRiskEvent"("agencyId", "occurredAt");

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyRiskEvent" ADD CONSTRAINT "AgencyRiskEvent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "AgencyRiskState"("agencyId") ON DELETE CASCADE ON UPDATE CASCADE;


