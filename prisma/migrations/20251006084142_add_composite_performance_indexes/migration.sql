-- CreateIndex
CREATE INDEX "Order_createdById_status_createdAt_idx" ON "Order"("createdById", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_contactId_status_idx" ON "Order"("contactId", "status");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Product_isActive_category_idx" ON "Product"("isActive", "category");

-- CreateIndex
CREATE INDEX "Product_category_isActive_idx" ON "Product"("category", "isActive");
