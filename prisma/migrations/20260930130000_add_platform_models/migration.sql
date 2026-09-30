-- Additive only: preserves all existing tables, columns and rows.
CREATE TYPE "OutreachStage" AS ENUM ('SHORTLISTED', 'DRAFTED', 'CONTACTED', 'INTERVIEWING', 'OFFER_RECEIVED', 'REJECTED', 'CLOSED');

CREATE TYPE "StudentAcademicStatus" AS ENUM ('INCOMING_STUDENT', 'CURRENT_STUDENT', 'ALUMNI');

CREATE TYPE "CommunityPostCategory" AS ENUM ('HELP', 'VISA', 'UNIVERSITY', 'ACCOMMODATION', 'TRAVEL', 'JOBS', 'SCHOLARSHIP');

CREATE TYPE "ProvenanceStatus" AS ENUM ('VERIFIED', 'PENDING', 'REJECTED', 'FLAGGED');

CREATE TABLE "Professor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "labName" TEXT NOT NULL,
    "labUrl" TEXT,
    "email" TEXT NOT NULL,
    "googleScholarUrl" TEXT,
    "primaryDomain" TEXT NOT NULL,
    "researchInterests" TEXT[],
    "activeFundingIndicator" BOOLEAN NOT NULL DEFAULT true,
    "fundingSources" TEXT[],
    "acceptingStudents" BOOLEAN NOT NULL DEFAULT true,
    "recentPublications" JSONB,
    "hIndex" INTEGER,
    "citationsCount" INTEGER,
    "labLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProfessorOutreach" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "stage" "OutreachStage" NOT NULL DEFAULT 'SHORTLISTED',
    "subjectLine" TEXT,
    "emailDraft" TEXT,
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "followUpDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessorOutreach_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CountryCommunity" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "flagEmoji" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "popularCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topUniversities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quickLinks" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryCommunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentCommunityMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "status" "StudentAcademicStatus" NOT NULL DEFAULT 'INCOMING_STUDENT',
    "targetOrCurrentUniversity" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSeniorMentor" BOOLEAN NOT NULL DEFAULT false,
    "mentorBio" TEXT,
    "program" TEXT,
    "intake" TEXT,
    "isAvailableForChat" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCommunityMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "CommunityPostCategory" NOT NULL DEFAULT 'HELP',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isSeniorAsk" BOOLEAN NOT NULL DEFAULT false,
    "authorStatus" "StudentAcademicStatus" NOT NULL DEFAULT 'INCOMING_STUDENT',
    "authorUniversity" TEXT,
    "authorVerified" BOOLEAN NOT NULL DEFAULT false,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isSeniorAnswer" BOOLEAN NOT NULL DEFAULT false,
    "authorStatus" "StudentAcademicStatus" NOT NULL DEFAULT 'INCOMING_STUDENT',
    "authorUniversity" TEXT,
    "authorVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityPostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPostLike_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerMessageThread" (
    "id" TEXT NOT NULL,
    "firstUserId" TEXT NOT NULL,
    "secondUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerMessageThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeerMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CountryCostBenchmark" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "flagEmoji" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "exchangeRateBdt" DOUBLE PRECISION NOT NULL,
    "livingCostMonthlyPoishaMin" BIGINT NOT NULL,
    "livingCostMonthlyPoishaMax" BIGINT NOT NULL,
    "blockedAccountOrGicPoisha" BIGINT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "visaFeePoisha" BIGINT NOT NULL,
    "healthInsuranceYearlyPoisha" BIGINT NOT NULL,
    "officialGovUrl" TEXT NOT NULL,
    "officialGovSourceTitle" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "verifiedByAdminId" TEXT,
    "lastAuditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryCostBenchmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UniversityCourseCatalog" (
    "id" TEXT NOT NULL,
    "benchmarkId" TEXT,
    "universityName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "degreeLevel" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "annualTuitionLocal" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "annualTuitionPoisha" BIGINT NOT NULL,
    "officialCatalogUrl" TEXT NOT NULL,
    "officialSourceTitle" TEXT NOT NULL,
    "intakeYear" TEXT NOT NULL DEFAULT '2026/2027',
    "status" "ProvenanceStatus" NOT NULL DEFAULT 'VERIFIED',
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "verifiedByAdminId" TEXT,
    "lastAuditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityCourseCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyFeeSubmission" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "whenCharged" TEXT NOT NULL,
    "refundable" BOOLEAN NOT NULL DEFAULT true,
    "refundPolicy" TEXT NOT NULL,
    "proofDocumentUrls" TEXT[],
    "status" "ProvenanceStatus" NOT NULL DEFAULT 'PENDING',
    "adminFeedback" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyFeeSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Professor_email_key" ON "Professor"("email");

CREATE INDEX "Professor_university_idx" ON "Professor"("university");

CREATE INDEX "Professor_primaryDomain_idx" ON "Professor"("primaryDomain");

CREATE INDEX "Professor_country_idx" ON "Professor"("country");

CREATE INDEX "ProfessorOutreach_studentId_idx" ON "ProfessorOutreach"("studentId");

CREATE INDEX "ProfessorOutreach_professorId_idx" ON "ProfessorOutreach"("professorId");

CREATE INDEX "ProfessorOutreach_stage_idx" ON "ProfessorOutreach"("stage");

CREATE UNIQUE INDEX "ProfessorOutreach_studentId_professorId_key" ON "ProfessorOutreach"("studentId", "professorId");

CREATE UNIQUE INDEX "CountryCommunity_country_key" ON "CountryCommunity"("country");

CREATE INDEX "CountryCommunity_country_idx" ON "CountryCommunity"("country");

CREATE INDEX "StudentCommunityMembership_userId_idx" ON "StudentCommunityMembership"("userId");

CREATE INDEX "StudentCommunityMembership_communityId_idx" ON "StudentCommunityMembership"("communityId");

CREATE UNIQUE INDEX "StudentCommunityMembership_userId_communityId_key" ON "StudentCommunityMembership"("userId", "communityId");

CREATE INDEX "CommunityPost_communityId_idx" ON "CommunityPost"("communityId");

CREATE INDEX "CommunityPost_category_idx" ON "CommunityPost"("category");

CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

CREATE INDEX "CommunityPost_communityId_createdAt_id_idx" ON "CommunityPost"("communityId", "createdAt", "id");

CREATE INDEX "CommunityComment_postId_idx" ON "CommunityComment"("postId");

CREATE INDEX "CommunityComment_authorId_idx" ON "CommunityComment"("authorId");

CREATE INDEX "CommunityComment_postId_createdAt_id_idx" ON "CommunityComment"("postId", "createdAt", "id");

CREATE INDEX "CommunityPostLike_postId_idx" ON "CommunityPostLike"("postId");

CREATE INDEX "CommunityPostLike_userId_idx" ON "CommunityPostLike"("userId");

CREATE UNIQUE INDEX "CommunityPostLike_postId_userId_key" ON "CommunityPostLike"("postId", "userId");

CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

CREATE INDEX "UserBlock_blockedUserId_idx" ON "UserBlock"("blockedUserId");

CREATE UNIQUE INDEX "UserBlock_blockerId_blockedUserId_key" ON "UserBlock"("blockerId", "blockedUserId");

CREATE INDEX "CommunityReport_postId_idx" ON "CommunityReport"("postId");

CREATE INDEX "CommunityReport_reporterId_idx" ON "CommunityReport"("reporterId");

CREATE UNIQUE INDEX "CommunityReport_reporterId_postId_key" ON "CommunityReport"("reporterId", "postId");

CREATE UNIQUE INDEX "CommunityReport_reporterId_commentId_key" ON "CommunityReport"("reporterId", "commentId");

CREATE INDEX "PeerMessageThread_firstUserId_updatedAt_idx" ON "PeerMessageThread"("firstUserId", "updatedAt");

CREATE INDEX "PeerMessageThread_secondUserId_updatedAt_idx" ON "PeerMessageThread"("secondUserId", "updatedAt");

CREATE UNIQUE INDEX "PeerMessageThread_firstUserId_secondUserId_key" ON "PeerMessageThread"("firstUserId", "secondUserId");

CREATE INDEX "PeerMessage_threadId_sentAt_id_idx" ON "PeerMessage"("threadId", "sentAt", "id");

CREATE UNIQUE INDEX "CountryCostBenchmark_country_key" ON "CountryCostBenchmark"("country");

CREATE INDEX "CountryCostBenchmark_country_idx" ON "CountryCostBenchmark"("country");

CREATE INDEX "CountryCostBenchmark_countryCode_idx" ON "CountryCostBenchmark"("countryCode");

CREATE INDEX "UniversityCourseCatalog_universityName_idx" ON "UniversityCourseCatalog"("universityName");

CREATE INDEX "UniversityCourseCatalog_country_idx" ON "UniversityCourseCatalog"("country");

CREATE INDEX "UniversityCourseCatalog_programName_idx" ON "UniversityCourseCatalog"("programName");

CREATE INDEX "AgencyFeeSubmission_agencyId_idx" ON "AgencyFeeSubmission"("agencyId");

CREATE INDEX "AgencyFeeSubmission_country_idx" ON "AgencyFeeSubmission"("country");

CREATE INDEX "AgencyFeeSubmission_status_idx" ON "AgencyFeeSubmission"("status");

ALTER TABLE "ProfessorOutreach" ADD CONSTRAINT "ProfessorOutreach_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfessorOutreach" ADD CONSTRAINT "ProfessorOutreach_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentCommunityMembership" ADD CONSTRAINT "StudentCommunityMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentCommunityMembership" ADD CONSTRAINT "StudentCommunityMembership_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "CountryCommunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "CountryCommunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPostLike" ADD CONSTRAINT "CommunityPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPostLike" ADD CONSTRAINT "CommunityPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PeerMessageThread" ADD CONSTRAINT "PeerMessageThread_firstUserId_fkey" FOREIGN KEY ("firstUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PeerMessageThread" ADD CONSTRAINT "PeerMessageThread_secondUserId_fkey" FOREIGN KEY ("secondUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PeerMessage" ADD CONSTRAINT "PeerMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "PeerMessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PeerMessage" ADD CONSTRAINT "PeerMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UniversityCourseCatalog" ADD CONSTRAINT "UniversityCourseCatalog_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "CountryCostBenchmark"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyFeeSubmission" ADD CONSTRAINT "AgencyFeeSubmission_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PeerMessageThread" ADD CONSTRAINT "PeerMessageThread_ordered_participants_check" CHECK ("firstUserId" < "secondUserId");

ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_one_target_check" CHECK (("postId" IS NOT NULL)::int + ("commentId" IS NOT NULL)::int = 1);

