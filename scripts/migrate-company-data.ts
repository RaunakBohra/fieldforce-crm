/**
 * Data Migration Script: Assign companyId to existing territories and products
 * This script assigns all existing territories and products to the Truederma company
 */

import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

async function migrateData() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🚀 Starting data migration...\n');

    // Step 1: Find Truederma company
    console.log('Step 1: Finding Truederma company...');
    const truederma = await prisma.company.findFirst({
      where: {
        OR: [
          { name: { contains: 'Truederma', mode: 'insensitive' } },
          { email: { contains: 'truederma', mode: 'insensitive' } },
        ],
      },
    });

    if (!truederma) {
      console.error('❌ Error: Truederma company not found');
      console.log('Creating Truederma company...');
      
      const newCompany = await prisma.company.create({
        data: {
          name: 'Truederma',
          email: 'admin@truederma.com',
          phone: '+977-1-4123456',
          address: 'Kathmandu, Nepal',
        },
      });
      
      console.log('✅ Created Truederma company:', newCompany.id);
      return migrateWithCompany(prisma, newCompany.id);
    }

    console.log(`✅ Found Truederma company: ${truederma.name} (${truederma.id})\n`);
    
    await migrateWithCompany(prisma, truederma.id);

    // Disconnect
    await prisma.$disconnect();
    await pool.end();
  } catch (error) {
    await prisma.$disconnect();
    await pool.end();
    throw error;
  }
}

async function migrateWithCompany(prisma: PrismaClient, companyId: string) {
  // Step 2: Update territories
  console.log('Step 2: Updating territories...');
  const territoriesWithoutCompany = await prisma.territory.findMany({
    where: { companyId: null },
    select: { id: true, name: true, code: true },
  });

  console.log(`Found ${territoriesWithoutCompany.length} territories without companyId`);

  if (territoriesWithoutCompany.length > 0) {
    const territoryUpdate = await prisma.territory.updateMany({
      where: { companyId: null },
      data: { companyId },
    });

    console.log(`✅ Updated ${territoryUpdate.count} territories with companyId\n`);
  } else {
    console.log('✅ No territories to update\n');
  }

  // Step 3: Update products
  console.log('Step 3: Updating products...');
  const productsWithoutCompany = await prisma.product.findMany({
    where: { companyId: null },
    select: { id: true, name: true, sku: true },
  });

  console.log(`Found ${productsWithoutCompany.length} products without companyId`);

  if (productsWithoutCompany.length > 0) {
    const productUpdate = await prisma.product.updateMany({
      where: { companyId: null },
      data: { companyId },
    });

    console.log(`✅ Updated ${productUpdate.count} products with companyId\n`);
  } else {
    console.log('✅ No products to update\n');
  }

  // Step 4: Verify migration
  console.log('Step 4: Verifying migration...');
  const [territoryCount, productCount] = await Promise.all([
    prisma.territory.count({ where: { companyId } }),
    prisma.product.count({ where: { companyId } }),
  ]);

  console.log(`\n📊 Migration Summary:`);
  console.log(`   - Territories assigned to Truederma: ${territoryCount}`);
  console.log(`   - Products assigned to Truederma: ${productCount}`);
  console.log(`\n✅ Migration completed successfully!`);
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
