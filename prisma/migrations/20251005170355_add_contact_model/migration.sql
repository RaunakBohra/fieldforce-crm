-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('DOCTOR', 'PHARMACIST', 'RETAILER', 'HOSPITAL', 'CLINIC', 'OTHER');

-- CreateEnum
CREATE TYPE "VisitFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "specialty" TEXT,
    "contactType" "ContactType" NOT NULL DEFAULT 'DOCTOR',
    "phone" TEXT,
    "email" TEXT,
    "alternatePhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "hospitalName" TEXT,
    "clinicName" TEXT,
    "licenseNumber" TEXT,
    "visitFrequency" "VisitFrequency" NOT NULL DEFAULT 'MONTHLY',
    "preferredDay" TEXT,
    "preferredTime" TEXT,
    "lastVisitDate" TIMESTAMP(3),
    "nextVisitDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "companyId" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contact_assignedToId_idx" ON "Contact"("assignedToId");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Contact_contactType_idx" ON "Contact"("contactType");

-- CreateIndex
CREATE INDEX "Contact_city_idx" ON "Contact"("city");

-- CreateIndex
CREATE INDEX "Contact_isActive_idx" ON "Contact"("isActive");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
