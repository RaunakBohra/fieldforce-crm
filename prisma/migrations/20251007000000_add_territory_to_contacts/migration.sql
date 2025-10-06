-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "territoryId" TEXT;

-- CreateIndex
CREATE INDEX "Contact_territoryId_idx" ON "Contact"("territoryId");

-- CreateIndex
CREATE INDEX "Contact_territoryId_isActive_idx" ON "Contact"("territoryId", "isActive");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
