-- Additive provenance and admissions metadata for database-backed counselor recommendations.
ALTER TABLE "UniversityCourseCatalog"
  ADD COLUMN "city" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "minimumGpa" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
  ADD COLUMN "minimumIelts" DOUBLE PRECISION NOT NULL DEFAULT 6.5,
  ADD COLUMN "maxStudyGapYears" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "scholarshipInfo" TEXT,
  ADD COLUMN "acceptsMoi" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "coopAvailable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "fieldTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "submittedByAgencyId" TEXT;

CREATE INDEX "UniversityCourseCatalog_submittedByAgencyId_idx"
  ON "UniversityCourseCatalog"("submittedByAgencyId");

ALTER TABLE "UniversityCourseCatalog"
  ADD CONSTRAINT "UniversityCourseCatalog_submittedByAgencyId_fkey"
  FOREIGN KEY ("submittedByAgencyId") REFERENCES "Agency"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
