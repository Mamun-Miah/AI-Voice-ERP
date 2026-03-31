const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sales = await prisma.sale.findMany({ where: { branchId: null } });
  if (sales.length > 0) {
    // get a valid branch from the business
    for (const sale of sales) {
      const branch = await prisma.branch.findFirst({ where: { businessId: sale.businessId } });
      if (branch) {
        await prisma.sale.update({
          where: { id: sale.id },
          data: { branchId: branch.id }
        });
        console.log(`Updated sale ${sale.id} with branch ${branch.id}`);
      }
    }
  } else {
    console.log("No sales with null branchId found.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
