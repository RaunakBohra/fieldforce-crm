-- CreateIndex
CREATE INDEX "Order_createdById_paymentStatus_idx" ON "Order"("createdById", "paymentStatus");

-- CreateIndex
CREATE INDEX "Payment_recordedById_createdAt_idx" ON "Payment"("recordedById", "createdAt");

-- CreateIndex
CREATE INDEX "Visit_fieldRepId_createdAt_idx" ON "Visit"("fieldRepId", "createdAt");

-- CreateIndex
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");
