/**
 * Test script to schedule a visit for testing purposes
 * Bypasses CSRF by directly updating the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function scheduleTestVisit() {
  try {
    // Use existing contact ID from the API
    const contactId = 'cmgf1nsz50001100rx7apiwm7'; // aple

    // Get the contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      console.error(`Contact ${contactId} not found`);
      process.exit(1);
    }

    console.log(`Found contact: ${contact.name} (${contact.id})`);

    // Schedule a visit for tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        nextVisitDate: tomorrow,
      }
    });

    console.log(`✅ Scheduled visit for ${updated.name} on ${updated.nextVisitDate}`);
    console.log(`   Contact ID: ${updated.id}`);
  } catch (error) {
    console.error('Error scheduling visit:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

scheduleTestVisit();
