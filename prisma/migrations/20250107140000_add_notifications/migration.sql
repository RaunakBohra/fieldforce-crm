-- AlterTable
ALTER TABLE "Order" ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "creditPeriod" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "launchNotifications" TEXT[];

-- CreateTable
CREATE TABLE "PaymentReminder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLaunchNotification" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sentTo" TEXT[],
    "channel" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductLaunchNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentReminder_orderId_idx" ON "PaymentReminder"("orderId");

-- CreateIndex
CREATE INDEX "PaymentReminder_sentAt_idx" ON "PaymentReminder"("sentAt");

-- CreateIndex
CREATE INDEX "ProductLaunchNotification_productId_idx" ON "ProductLaunchNotification"("productId");

-- CreateIndex
CREATE INDEX "ProductLaunchNotification_sentAt_idx" ON "ProductLaunchNotification"("sentAt");

-- AddForeignKey
ALTER TABLE "PaymentReminder" ADD CONSTRAINT "PaymentReminder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLaunchNotification" ADD CONSTRAINT "ProductLaunchNotification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
