-- CreateIndex
-- Add composite index on Visit table for (contactId, createdAt)
-- Optimizes territory analytics queries that join visits by contact and filter by date
CREATE INDEX "Visit_contactId_createdAt_idx" ON "Visit"("contactId", "createdAt");

-- CreateIndex
-- Add composite index on Order table for (contactId, createdAt)
-- Optimizes territory analytics queries that join orders by contact and filter by date
CREATE INDEX "Order_contactId_createdAt_idx" ON "Order"("contactId", "createdAt");
