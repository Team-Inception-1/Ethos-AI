-- Persist account-bound Counselor state, Campus Living source records, and notifications.
-- The preceding catalog migration was deployed with a nullable database column
-- even though Prisma models it as a required list. Normalize before enforcing it.
UPDATE "UniversityCourseCatalog" SET "fieldTags" = ARRAY[]::TEXT[] WHERE "fieldTags" IS NULL;
ALTER TABLE "UniversityCourseCatalog" ALTER COLUMN "fieldTags" SET NOT NULL;

CREATE TABLE "CounselorShortlist" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "catalogId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CounselorShortlist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CounselorRoadmapTask" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "taskKey" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CounselorRoadmapTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampusUniversity" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "shortName" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT,
  "country" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "currencySymbol" TEXT NOT NULL,
  "exchangeRateBdt" DOUBLE PRECISION NOT NULL,
  "dormSituation" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceTitle" TEXT,
  "lastAuditedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampusUniversity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampusArea" (
  "id" TEXT NOT NULL,
  "universityId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "distance" TEXT NOT NULL,
  "walkTime" TEXT NOT NULL,
  "commuteType" TEXT NOT NULL,
  "safetyScore" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "groceryOptions" TEXT NOT NULL,
  "rent" JSONB NOT NULL,
  "utilitiesMonthly" JSONB NOT NULL,
  "foodGroceries" JSONB NOT NULL,
  "shoppingPersonal" JSONB NOT NULL,
  "transportation" JSONB NOT NULL,
  "healthMisc" JSONB NOT NULL,
  "sourceUrl" TEXT,
  "lastAuditedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampusArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CounselorShortlist_userId_catalogId_key" ON "CounselorShortlist"("userId", "catalogId");
CREATE INDEX "CounselorShortlist_userId_idx" ON "CounselorShortlist"("userId");
CREATE UNIQUE INDEX "CounselorRoadmapTask_userId_taskKey_key" ON "CounselorRoadmapTask"("userId", "taskKey");
CREATE INDEX "CounselorRoadmapTask_userId_idx" ON "CounselorRoadmapTask"("userId");
CREATE INDEX "CampusUniversity_country_idx" ON "CampusUniversity"("country");
CREATE INDEX "CampusUniversity_region_idx" ON "CampusUniversity"("region");
CREATE INDEX "CampusUniversity_city_idx" ON "CampusUniversity"("city");
CREATE INDEX "CampusArea_universityId_idx" ON "CampusArea"("universityId");
CREATE INDEX "CampusArea_name_idx" ON "CampusArea"("name");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");

ALTER TABLE "CounselorShortlist" ADD CONSTRAINT "CounselorShortlist_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CounselorShortlist" ADD CONSTRAINT "CounselorShortlist_catalogId_fkey"
  FOREIGN KEY ("catalogId") REFERENCES "UniversityCourseCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CounselorRoadmapTask" ADD CONSTRAINT "CounselorRoadmapTask_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampusArea" ADD CONSTRAINT "CampusArea_universityId_fkey"
  FOREIGN KEY ("universityId") REFERENCES "CampusUniversity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
