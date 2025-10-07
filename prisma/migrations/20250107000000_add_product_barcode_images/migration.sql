-- AlterTable Product add barcode and image fields
ALTER TABLE "Product" ADD COLUMN "barcode" TEXT;
ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "thumbnailUrl" TEXT;

-- CreateIndex
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");
