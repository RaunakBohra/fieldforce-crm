-- CreateEnum
CREATE TYPE "TerritoryType" AS ENUM ('COUNTRY', 'STATE', 'CITY', 'DISTRICT', 'ZONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "territoryId" TEXT;

-- CreateTable
CREATE TABLE "Territory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "TerritoryType" NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Territory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Territory_code_key" ON "Territory"("code");

-- CreateIndex
CREATE INDEX "Territory_country_idx" ON "Territory"("country");

-- CreateIndex
CREATE INDEX "Territory_state_idx" ON "Territory"("state");

-- CreateIndex
CREATE INDEX "Territory_parentId_idx" ON "Territory"("parentId");

-- CreateIndex
CREATE INDEX "Territory_isActive_idx" ON "Territory"("isActive");

-- CreateIndex
CREATE INDEX "Territory_type_idx" ON "Territory"("type");

-- CreateIndex
CREATE INDEX "User_territoryId_idx" ON "User"("territoryId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
