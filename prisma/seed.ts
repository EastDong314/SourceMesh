import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample data sources
  const sources = [
    {
      name: 'hacker-news',
      url: 'https://news.ycombinator.com/',
      enabled: true,
      schedule: '*/30 * * * *',
      timeout: 15000,
      retries: 3,
    },
    {
      name: 'product-hunt',
      url: 'https://www.producthunt.com/',
      enabled: false,
      timeout: 20000,
      retries: 2,
    },
  ];

  for (const source of sources) {
    await prisma.dataSource.upsert({
      where: { name: source.name },
      update: source,
      create: source,
    });
    console.log(`Upserted source: ${source.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
