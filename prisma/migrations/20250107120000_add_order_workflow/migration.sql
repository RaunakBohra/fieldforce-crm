-- AddOrderWorkflow Migration
-- Add DRAFT and DISPATCHED to OrderStatus enum
-- Add notes as TEXT and cancellationReason to Order table

-- Step 1: Add new enum values to OrderStatus
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPATCHED';

-- Step 2: Alter Order table to add notes as TEXT and cancellationReason
-- First check if columns exist, if not add them
DO $$
BEGIN
  -- Change notes from VARCHAR to TEXT if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Order' AND column_name = 'notes'
  ) THEN
    ALTER TABLE "Order" ALTER COLUMN "notes" TYPE TEXT;
  ELSE
    ALTER TABLE "Order" ADD COLUMN "notes" TEXT;
  END IF;

  -- Add cancellationReason if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Order' AND column_name = 'cancellationReason'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "cancellationReason" TEXT;
  END IF;
END $$;
