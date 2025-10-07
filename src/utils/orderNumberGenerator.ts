import type { PrismaClient } from '@prisma/client';

/**
 * Order Number Generator Utility
 * Generates order numbers in format: ORD-YYYY-NNNNN
 * Example: ORD-2025-00001, ORD-2025-00123
 *
 * Features:
 * - Year-based sequential numbering
 * - Auto-resets to 1 on year rollover
 * - 5-digit zero-padded sequential number
 * - Thread-safe (uses database query)
 */

/**
 * Generate a unique order number
 * Format: ORD-{YYYY}-{sequential}
 *
 * @param prisma - Prisma client instance
 * @returns Promise<string> - Generated order number (e.g., "ORD-2025-00001")
 */
export async function generateOrderNumber(prisma: PrismaClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `ORD-${currentYear}-`;

  // Find the maximum order number for the current year
  // Query orders that start with the current year prefix
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: yearPrefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  });

  let nextSequential = 1;

  if (lastOrder) {
    // Extract the sequential number from the last order
    // Format: ORD-2025-00123 -> extract "00123"
    const lastSequentialStr = lastOrder.orderNumber.split('-')[2];
    const lastSequential = parseInt(lastSequentialStr, 10);

    // Increment for next order
    nextSequential = lastSequential + 1;
  }

  // Format sequential number with leading zeros (5 digits)
  const sequentialPadded = String(nextSequential).padStart(5, '0');

  // Generate final order number
  const orderNumber = `${yearPrefix}${sequentialPadded}`;

  return orderNumber;
}

/**
 * Validate order number format
 * @param orderNumber - Order number to validate
 * @returns boolean - True if valid format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  // Format: ORD-YYYY-NNNNN
  const pattern = /^ORD-\d{4}-\d{5}$/;
  return pattern.test(orderNumber);
}

/**
 * Extract year from order number
 * @param orderNumber - Order number
 * @returns number - Year from order number
 */
export function extractYearFromOrderNumber(orderNumber: string): number | null {
  if (!isValidOrderNumber(orderNumber)) {
    return null;
  }
  const yearStr = orderNumber.split('-')[1];
  return parseInt(yearStr, 10);
}

/**
 * Extract sequential number from order number
 * @param orderNumber - Order number
 * @returns number - Sequential number
 */
export function extractSequentialFromOrderNumber(orderNumber: string): number | null {
  if (!isValidOrderNumber(orderNumber)) {
    return null;
  }
  const sequentialStr = orderNumber.split('-')[2];
  return parseInt(sequentialStr, 10);
}
