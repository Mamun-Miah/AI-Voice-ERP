import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const businessTypes = [
    { value: 'retail', labelEn: 'Retail', labelBn: 'খুচরা' },
    { value: 'wholesale', labelEn: 'Wholesale', labelBn: 'থোক' },
    { value: 'pharmacy', labelEn: 'Pharmacy', labelBn: 'ফার্মেসি' },
  ];

  for (const type of businessTypes) {
    await prisma.businessType.upsert({
      where: { value: type.value },
      update: {},
      create: type,
    });
  }

  console.log('Seeded business types ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
