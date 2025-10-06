-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('FIELD_VISIT', 'FOLLOW_UP', 'EMERGENCY', 'PLANNED', 'COLD_CALL', 'VIRTUAL', 'EVENT');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "VisitOutcome" AS ENUM ('SUCCESSFUL', 'PARTIAL', 'UNSUCCESSFUL', 'FOLLOW_UP_NEEDED', 'ORDER_PLACED', 'SAMPLE_GIVEN', 'INFORMATION_ONLY');

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitType" "VisitType" NOT NULL DEFAULT 'FIELD_VISIT',
    "status" "VisitStatus" NOT NULL DEFAULT 'COMPLETED',
    "duration" INTEGER,
    "contactId" TEXT NOT NULL,
    "fieldRepId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "purpose" TEXT,
    "notes" TEXT,
    "outcome" "VisitOutcome" NOT NULL DEFAULT 'SUCCESSFUL',
    "nextVisitDate" TIMESTAMP(3),
    "products" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "samplesGiven" JSONB,
    "marketingMaterials" JSONB,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_contactId_visitDate_idx" ON "Visit"("contactId", "visitDate");

-- CreateIndex
CREATE INDEX "Visit_fieldRepId_visitDate_idx" ON "Visit"("fieldRepId", "visitDate");

-- CreateIndex
CREATE INDEX "Visit_visitDate_idx" ON "Visit"("visitDate");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Visit_fieldRepId_status_visitDate_idx" ON "Visit"("fieldRepId", "status", "visitDate");

-- CreateIndex
CREATE INDEX "Visit_contactId_status_idx" ON "Visit"("contactId", "status");

-- CreateIndex
CREATE INDEX "Contact_companyId_isActive_contactType_idx" ON "Contact"("companyId", "isActive", "contactType");

-- CreateIndex
CREATE INDEX "Contact_assignedToId_isActive_idx" ON "Contact"("assignedToId", "isActive");

-- CreateIndex
CREATE INDEX "Contact_companyId_contactType_isActive_idx" ON "Contact"("companyId", "contactType", "isActive");

-- CreateIndex
CREATE INDEX "Contact_city_contactType_idx" ON "Contact"("city", "contactType");

-- CreateIndex
CREATE INDEX "Contact_nextVisitDate_assignedToId_idx" ON "Contact"("nextVisitDate", "assignedToId");

-- CreateIndex
CREATE INDEX "Contact_isActive_createdAt_idx" ON "Contact"("isActive", "createdAt");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_fieldRepId_fkey" FOREIGN KEY ("fieldRepId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
