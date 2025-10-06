-- DropIndex redundant and unused indexes from Contact
DROP INDEX IF EXISTS "Contact_contactType_idx";
DROP INDEX IF EXISTS "Contact_city_idx";
DROP INDEX IF EXISTS "Contact_isActive_idx";
DROP INDEX IF EXISTS "Contact_companyId_contactType_isActive_idx";
DROP INDEX IF EXISTS "Contact_city_contactType_idx";

-- DropIndex redundant indexes from Visit
DROP INDEX IF EXISTS "Visit_visitDate_idx";
DROP INDEX IF EXISTS "Visit_status_idx";
DROP INDEX IF EXISTS "Visit_contactId_status_idx";
DROP INDEX IF EXISTS "Visit_createdAt_idx";

-- DropIndex redundant indexes from Product
DROP INDEX IF EXISTS "Product_category_idx";
DROP INDEX IF EXISTS "Product_isActive_idx";
DROP INDEX IF EXISTS "Product_category_isActive_idx";

-- DropIndex redundant indexes from Order
DROP INDEX IF EXISTS "Order_contactId_idx";
DROP INDEX IF EXISTS "Order_createdById_idx";
DROP INDEX IF EXISTS "Order_status_idx";
DROP INDEX IF EXISTS "Order_createdAt_idx";
DROP INDEX IF EXISTS "Order_paymentStatus_idx";
DROP INDEX IF EXISTS "Order_contactId_status_idx";
DROP INDEX IF EXISTS "Order_paymentStatus_status_idx";
DROP INDEX IF EXISTS "Order_createdById_paymentStatus_idx";

-- DropIndex redundant indexes from Payment
DROP INDEX IF EXISTS "Payment_contactId_idx";
DROP INDEX IF EXISTS "Payment_recordedById_idx";
DROP INDEX IF EXISTS "Payment_paymentDate_idx";
DROP INDEX IF EXISTS "Payment_paymentMode_idx";
DROP INDEX IF EXISTS "Payment_status_idx";
DROP INDEX IF EXISTS "Payment_orderId_status_idx";

-- CreateIndex optimized Order indexes
CREATE INDEX "Order_createdById_paymentStatus_status_idx" ON "Order"("createdById", "paymentStatus", "status");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
