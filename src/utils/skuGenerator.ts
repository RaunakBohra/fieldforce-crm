/**
 * SKU Generator Utility
 * Generates unique SKU in format: MMYY-XXXX
 * Example: 0125-0001 (January 2025, sequence 1)
 */

import { PrismaClient } from '@prisma/client';

/**
 * Generate next SKU in MMYY-sequential format
 * @param prisma - Prisma client instance
 * @returns Promise<string> - Generated SKU (e.g., "0125-0001")
 */
export async function generateSKU(prisma: PrismaClient): Promise<string> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
  const year = String(now.getFullYear()).slice(-2); // Last 2 digits
  const prefix = `${month}${year}`; // e.g., "0125" for Jan 2025

  // Find highest SKU for current month-year
  const lastProduct = await prisma.product.findFirst({
    where: {
      sku: {
        startsWith: prefix,
      },
    },
    orderBy: {
      sku: 'desc',
    },
    select: {
      sku: true,
    },
  });

  let sequence = 1;

  if (lastProduct && lastProduct.sku) {
    // Extract sequence number from last SKU
    const parts = lastProduct.sku.split('-');
    if (parts.length === 2) {
      const lastSequence = parseInt(parts[1], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }

  // Format: MMYY-XXXX (e.g., "0125-0001")
  const sequenceStr = String(sequence).padStart(4, '0');
  return `${prefix}-${sequenceStr}`;
}

/**
 * Validate SKU format
 * @param sku - SKU to validate
 * @returns boolean - true if valid format
 */
export function isValidSKU(sku: string): boolean {
  // Format: MMYY-XXXX
  const regex = /^(0[1-9]|1[0-2])\d{2}-\d{4}$/;
  return regex.test(sku);
}
