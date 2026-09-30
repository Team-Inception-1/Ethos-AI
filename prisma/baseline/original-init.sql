-- Archived pre-stabilization migration; reference only, not deployed.
-- ==============================================================================
-- Ethos AI — Initial PostgreSQL Database Migration
-- Aligned with Issue #14 (K-11) & ETHOS_AI_CONTEXT.md §6
-- ==============================================================================

-- 1. Create Enums
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'AGENCY', 'ADMIN');
CREATE TYPE "LicenseStatus" AS ENUM ('VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED');
CREATE TYPE "ApplicationStage" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED', 'PAYMENT_PENDING', 'VISA_PROCESSING', 'VISA_APPROVED', 'VISA_REJECTED', 'COMPLETED');
CREATE TYPE "DocumentType" AS ENUM ('OFFER_LETTER', 'PAYMENT_RECEIPT', 'SIGNED_AGREEMENT', 'PASSPORT_ID', 'ACADEMIC_TRANSCRIPT', 'VISA_DOCUMENT', 'OTHER');
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'HELD', 'RELEASED', 'DISPUTED', 'REFUNDED');
CREATE TYPE "LedgerEntryType" AS ENUM ('HOLD', 'RELEASE', 'REFUND', 'DISPUTE_FREEZE');
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'ESCALATED');

-- 2. Create User Table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_email_idx" ON "User"("email");

-- 3. Create StudentProfile Table
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "targetCountries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "targetField" TEXT,
    "budgetRange" TEXT,
    "ieltsScore" TEXT,
    "linkCode" TEXT NOT NULL UNIQUE,
    "educationHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "StudentProfile_linkCode_idx" ON "StudentProfile"("linkCode");

-- 4. Create ParentLink Table
CREATE TABLE "ParentLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "relationship" TEXT NOT NULL DEFAULT 'Guardian',
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParentLink_parentId_studentId_key" UNIQUE ("parentId", "studentId")
);
CREATE INDEX "ParentLink_parentId_idx" ON "ParentLink"("parentId");
CREATE INDEX "ParentLink_studentId_idx" ON "ParentLink"("studentId");

-- 5. Create Agency Table
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerUserId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "name" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL UNIQUE,
    "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "countriesServed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Agency_licenseStatus_idx" ON "Agency"("licenseStatus");
CREATE INDEX "Agency_riskScore_idx" ON "Agency"("riskScore");
CREATE INDEX "Agency_rating_idx" ON "Agency"("rating");

-- 6. Create AgencyPricing Table
CREATE TABLE "AgencyPricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "serviceName" TEXT NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "whenCharged" TEXT NOT NULL,
    "refundable" BOOLEAN NOT NULL DEFAULT false,
    "conditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AgencyPricing_agencyId_idx" ON "AgencyPricing"("agencyId");

-- 7. Create Review Table
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "agencyId" TEXT NOT NULL REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "applicationId" TEXT UNIQUE,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Review_agencyId_idx" ON "Review"("agencyId");
CREATE INDEX "Review_studentId_idx" ON "Review"("studentId");

-- 8. Create Application Table
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "agencyId" TEXT NOT NULL REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "targetCountry" TEXT NOT NULL,
    "targetUniversity" TEXT NOT NULL,
    "targetProgram" TEXT NOT NULL,
    "intakeSemester" TEXT,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Application_studentId_idx" ON "Application"("studentId");
CREATE INDEX "Application_agencyId_idx" ON "Application"("agencyId");
CREATE INDEX "Application_stage_idx" ON "Application"("stage");

-- 9. Create StageEvent Table
CREATE TABLE "StageEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "stage" "ApplicationStage" NOT NULL,
    "actorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "actorRole" "UserRole" NOT NULL,
    "note" TEXT,
    "documentId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "StageEvent_applicationId_idx" ON "StageEvent"("applicationId");
CREATE INDEX "StageEvent_timestamp_idx" ON "StageEvent"("timestamp");

-- 10. Create Document Table
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "applicationId" TEXT REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "type" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Document_ownerId_idx" ON "Document"("ownerId");
CREATE INDEX "Document_applicationId_idx" ON "Document"("applicationId");
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- 11. Create DocumentScan Table
CREATE TABLE "DocumentScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL UNIQUE REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "riskScore" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "flags" JSONB NOT NULL,
    "senderDomain" TEXT,
    "modelVersion" TEXT NOT NULL DEFAULT 'ocr-v1.0',
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "DocumentScan_riskScore_idx" ON "DocumentScan"("riskScore");

-- 12. Create AgreementAnalysis Table
CREATE TABLE "AgreementAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL UNIQUE REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "extractedClauses" JSONB NOT NULL,
    "flaggedIssues" JSONB NOT NULL,
    "riskVerdict" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Create Milestone Table
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "amountPoisha" BIGINT NOT NULL,
    "releaseCondition" TEXT NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Milestone_applicationId_idx" ON "Milestone"("applicationId");
CREATE INDEX "Milestone_status_idx" ON "Milestone"("status");

-- 14. Create LedgerEntry Table (Append-Only)
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "milestoneId" TEXT NOT NULL REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "type" "LedgerEntryType" NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SSLCOMMERZ',
    "providerTxnId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "LedgerEntry_milestoneId_idx" ON "LedgerEntry"("milestoneId");
CREATE INDEX "LedgerEntry_providerTxnId_idx" ON "LedgerEntry"("providerTxnId");
CREATE INDEX "LedgerEntry_timestamp_idx" ON "LedgerEntry"("timestamp");

-- 15. Create Receipt Table
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerEntryId" TEXT NOT NULL UNIQUE REFERENCES "LedgerEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "receiptNumber" TEXT NOT NULL UNIQUE,
    "amountPoisha" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "pdfStorageKey" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber");

-- 16. Create ChatThread Table
CREATE TABLE "ChatThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL UNIQUE REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "agencyId" TEXT NOT NULL REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ChatThread_agencyId_idx" ON "ChatThread"("agencyId");
CREATE INDEX "ChatThread_applicationId_idx" ON "ChatThread"("applicationId");

-- 17. Create ChatMessage Table (Tamper-evident)
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "senderRole" "UserRole" NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentDocId" TEXT REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "msgHash" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ChatMessage_threadId_idx" ON "ChatMessage"("threadId");
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");
CREATE INDEX "ChatMessage_sentAt_idx" ON "ChatMessage"("sentAt");

-- 18. Create Complaint Table
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "agencyId" TEXT NOT NULL REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "filedById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceDocs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3)
);
CREATE INDEX "Complaint_applicationId_idx" ON "Complaint"("applicationId");
CREATE INDEX "Complaint_agencyId_idx" ON "Complaint"("agencyId");
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- 19. Create VerificationReport Table
CREATE TABLE "VerificationReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "purchasedById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "reportSummary" JSONB NOT NULL,
    "pricePoisha" BIGINT NOT NULL DEFAULT 29900,
    "pdfStorageKey" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "VerificationReport_agencyId_idx" ON "VerificationReport"("agencyId");
CREATE INDEX "VerificationReport_purchasedById_idx" ON "VerificationReport"("purchasedById");

-- 20. Create Subscription Table
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "tier" TEXT NOT NULL DEFAULT 'PREMIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "pricePoisha" BIGINT NOT NULL DEFAULT 999900,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Subscription_agencyId_idx" ON "Subscription"("agencyId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
