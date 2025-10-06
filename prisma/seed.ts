import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed products
  const products = [
    {
      name: 'Paracetamol 500mg',
      sku: 'MED-PARA-500',
      description: 'Pain reliever and fever reducer',
      category: 'Pain Relief',
      price: 50.00,
      stock: 1000
    },
    {
      name: 'Amoxicillin 250mg',
      sku: 'MED-AMOX-250',
      description: 'Antibiotic for bacterial infections',
      category: 'Antibiotics',
      price: 120.00,
      stock: 500
    },
    {
      name: 'Ibuprofen 400mg',
      sku: 'MED-IBUP-400',
      description: 'Anti-inflammatory and pain relief',
      category: 'Pain Relief',
      price: 80.00,
      stock: 750
    },
    {
      name: 'Cetirizine 10mg',
      sku: 'MED-CETI-10',
      description: 'Antihistamine for allergies',
      category: 'Antihistamines',
      price: 60.00,
      stock: 600
    },
    {
      name: 'Vitamin C 1000mg',
      sku: 'SUP-VITC-1000',
      description: 'Immunity booster supplement',
      category: 'Supplements',
      price: 150.00,
      stock: 400
    },
    {
      name: 'Omeprazole 20mg',
      sku: 'MED-OMEP-20',
      description: 'Proton pump inhibitor for acid reflux',
      category: 'Gastric',
      price: 90.00,
      stock: 550
    },
    {
      name: 'Metformin 500mg',
      sku: 'MED-METF-500',
      description: 'Diabetes medication',
      category: 'Diabetes',
      price: 100.00,
      stock: 450
    },
    {
      name: 'Aspirin 75mg',
      sku: 'MED-ASPI-75',
      description: 'Blood thinner for cardiovascular health',
      category: 'Cardiovascular',
      price: 40.00,
      stock: 800
    },
    {
      name: 'Ciprofloxacin 500mg',
      sku: 'MED-CIPR-500',
      description: 'Broad-spectrum antibiotic',
      category: 'Antibiotics',
      price: 180.00,
      stock: 350
    },
    {
      name: 'Multivitamin Complex',
      sku: 'SUP-MULTI-COMP',
      description: 'Daily multivitamin supplement',
      category: 'Supplements',
      price: 200.00,
      stock: 300
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product
    });
  }

  console.log('✓ Products seeded:', products.length);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
