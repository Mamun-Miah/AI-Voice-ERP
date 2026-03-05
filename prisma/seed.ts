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
    { value: 'grocery', labelEn: 'Grocery', labelBn: 'মুদির দোকান' },
    { value: 'electronics', labelEn: 'Electronics', labelBn: 'ইলেকট্রনিক্স' },
    { value: 'fashion', labelEn: 'Fashion', labelBn: 'ফ্যাশন' },
    { value: 'restaurant', labelEn: 'Restaurant', labelBn: 'রেস্তোরাঁ' },
    { value: 'construction', labelEn: 'Construction', labelBn: 'নির্মাণ' },
    { value: 'education', labelEn: 'Education', labelBn: 'শিক্ষা' },
    { value: 'healthcare', labelEn: 'Healthcare', labelBn: 'স্বাস্থ্যসেবা' },
    { value: 'logistics', labelEn: 'Logistics', labelBn: 'পরিবহন' },
    { value: 'beauty', labelEn: 'Beauty', labelBn: 'সৌন্দর্য' },
    { value: 'automobile', labelEn: 'Automobile', labelBn: 'অটোমোবাইল' },
    { value: 'sports', labelEn: 'Sports', labelBn: 'খেলাধুলা' },
    { value: 'stationery', labelEn: 'Stationery', labelBn: 'স্টেশনারি' },
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
