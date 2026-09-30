-- Approved reconciliation: exact existing 19 application tables, not the unmanaged Neon example table.
-- No migration history existed in live Neon; the former inaccurate SQL is archived in prisma/baseline.
-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED', 'PAYMENT_PENDING', 'VISA_PROCESSING', 'VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('OFFER_LETTER', 'PAYMENT_RECEIPT', 'SIGNED_AGREEMENT', 'PASSPORT_ID', 'ACADEMIC_TRANSCRIPT', 'VISA_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('HOLD', 'RELEASE', 'REFUND', 'DISPUTE_FREEZE');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'HELD', 'RELEASED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'AGENCY', 'ADMIN');

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "countriesServed" TEXT[],
    "foundedYear" INTEGER NOT NULL DEFAULT 2020,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" INTEGER NOT NULL DEFAULT 90,
    "feeMinPoisha" BIGINT NOT NULL DEFAULT 2500000,
    "feeMaxPoisha" BIGINT NOT NULL DEFAULT 8000000,
    "address" TEXT,
    "website" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyPricing" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "whenCharged" TEXT NOT NULL,
    "refundable" BOOLEAN NOT NULL DEFAULT false,
    "conditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementAnalysis" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "extractedClauses" JSONB NOT NULL,
    "flaggedIssues" JSONB NOT NULL,
    "riskVerdict" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgreementAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "targetCountry" TEXT NOT NULL,
    "targetUniversity" TEXT NOT NULL,
    "targetProgram" TEXT NOT NULL,
    "intakeSemester" TEXT,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "UserRole" NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentDocId" TEXT,
    "msgHash" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatThread" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "filedById" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceDocs" TEXT[],
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "applicationId" TEXT,
    "type" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentScan" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "flags" JSONB NOT NULL,
    "senderDomain" TEXT,
    "modelVersion" TEXT NOT NULL DEFAULT 'ocr-v1.0',
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SSLCOMMERZ',
    "providerTxnId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "amountPoisha" BIGINT NOT NULL,
    "releaseCondition" TEXT NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentLink" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'Guardian',
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "ledgerEntryId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "pdfStorageKey" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "applicationId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stage" "ApplicationStage" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "note" TEXT,
    "documentId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetCountries" TEXT[],
    "targetField" TEXT,
    "budgetRange" TEXT,
    "ieltsScore" TEXT,
    "linkCode" TEXT NOT NULL,
    "educationHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'PREMIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "pricePoisha" BIGINT NOT NULL DEFAULT 999900,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationReport" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "purchasedById" TEXT NOT NULL,
    "reportSummary" JSONB NOT NULL,
    "pricePoisha" BIGINT NOT NULL DEFAULT 29900,
    "pdfStorageKey" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_licenseNo_key" ON "Agency"("licenseNo" ASC);

-- CreateIndex
CREATE INDEX "Agency_licenseStatus_idx" ON "Agency"("licenseStatus" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_ownerUserId_key" ON "Agency"("ownerUserId" ASC);

-- CreateIndex
CREATE INDEX "Agency_rating_idx" ON "Agency"("rating" ASC);

-- CreateIndex
CREATE INDEX "Agency_riskScore_idx" ON "Agency"("riskScore" ASC);

-- CreateIndex
CREATE INDEX "AgencyPricing_agencyId_idx" ON "AgencyPricing"("agencyId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AgreementAnalysis_documentId_key" ON "AgreementAnalysis"("documentId" ASC);

-- CreateIndex
CREATE INDEX "Application_agencyId_idx" ON "Application"("agencyId" ASC);

-- CreateIndex
CREATE INDEX "Application_stage_idx" ON "Application"("stage" ASC);

-- CreateIndex
CREATE INDEX "Application_studentId_idx" ON "Application"("studentId" ASC);

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId" ASC);

-- CreateIndex
CREATE INDEX "ChatMessage_sentAt_idx" ON "ChatMessage"("sentAt" ASC);

-- CreateIndex
CREATE INDEX "ChatMessage_threadId_idx" ON "ChatMessage"("threadId" ASC);

-- CreateIndex
CREATE INDEX "ChatThread_agencyId_idx" ON "ChatThread"("agencyId" ASC);

-- CreateIndex
CREATE INDEX "ChatThread_applicationId_idx" ON "ChatThread"("applicationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChatThread_applicationId_key" ON "ChatThread"("applicationId" ASC);

-- CreateIndex
CREATE INDEX "Complaint_agencyId_idx" ON "Complaint"("agencyId" ASC);

-- CreateIndex
CREATE INDEX "Complaint_applicationId_idx" ON "Complaint"("applicationId" ASC);

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status" ASC);

-- CreateIndex
CREATE INDEX "Document_applicationId_idx" ON "Document"("applicationId" ASC);

-- CreateIndex
CREATE INDEX "Document_ownerId_idx" ON "Document"("ownerId" ASC);

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentScan_documentId_key" ON "DocumentScan"("documentId" ASC);

-- CreateIndex
CREATE INDEX "DocumentScan_riskScore_idx" ON "DocumentScan"("riskScore" ASC);

-- CreateIndex
CREATE INDEX "LedgerEntry_milestoneId_idx" ON "LedgerEntry"("milestoneId" ASC);

-- CreateIndex
CREATE INDEX "LedgerEntry_providerTxnId_idx" ON "LedgerEntry"("providerTxnId" ASC);

-- CreateIndex
CREATE INDEX "LedgerEntry_timestamp_idx" ON "LedgerEntry"("timestamp" ASC);

-- CreateIndex
CREATE INDEX "Milestone_applicationId_idx" ON "Milestone"("applicationId" ASC);

-- CreateIndex
CREATE INDEX "Milestone_status_idx" ON "Milestone"("status" ASC);

-- CreateIndex
CREATE INDEX "ParentLink_parentId_idx" ON "ParentLink"("parentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ParentLink_parentId_studentId_key" ON "ParentLink"("parentId" ASC, "studentId" ASC);

-- CreateIndex
CREATE INDEX "ParentLink_studentId_idx" ON "ParentLink"("studentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_ledgerEntryId_key" ON "Receipt"("ledgerEntryId" ASC);

-- CreateIndex
CREATE INDEX "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber" ASC);

-- CreateIndex
CREATE INDEX "Review_agencyId_idx" ON "Review"("agencyId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Review_applicationId_key" ON "Review"("applicationId" ASC);

-- CreateIndex
CREATE INDEX "Review_studentId_idx" ON "Review"("studentId" ASC);

-- CreateIndex
CREATE INDEX "StageEvent_applicationId_idx" ON "StageEvent"("applicationId" ASC);

-- CreateIndex
CREATE INDEX "StageEvent_timestamp_idx" ON "StageEvent"("timestamp" ASC);

-- CreateIndex
CREATE INDEX "StudentProfile_linkCode_idx" ON "StudentProfile"("linkCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_linkCode_key" ON "StudentProfile"("linkCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId" ASC);

-- CreateIndex
CREATE INDEX "Subscription_agencyId_idx" ON "Subscription"("agencyId" ASC);

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status" ASC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone" ASC);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role" ASC);

-- CreateIndex
CREATE INDEX "VerificationReport_agencyId_idx" ON "VerificationReport"("agencyId" ASC);

-- CreateIndex
CREATE INDEX "VerificationReport_purchasedById_idx" ON "VerificationReport"("purchasedById" ASC);

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyPricing" ADD CONSTRAINT "AgencyPricing_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementAnalysis" ADD CONSTRAINT "AgreementAnalysis_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_attachmentDocId_fkey" FOREIGN KEY ("attachmentDocId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_filedById_fkey" FOREIGN KEY ("filedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentScan" ADD CONSTRAINT "DocumentScan_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentLink" ADD CONSTRAINT "ParentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentLink" ADD CONSTRAINT "ParentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_ledgerEntryId_fkey" FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageEvent" ADD CONSTRAINT "StageEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageEvent" ADD CONSTRAINT "StageEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationReport" ADD CONSTRAINT "VerificationReport_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationReport" ADD CONSTRAINT "VerificationReport_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
