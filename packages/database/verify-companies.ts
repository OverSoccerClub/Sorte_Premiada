import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching companies...');
    const companies = await prisma.company.findMany();
    console.log('Companies found:', companies.length);
    companies.forEach(c => {
        console.log(`- Name: ${c.companyName}, Slug: ${c.slug}, ID: ${c.id}`);
    });
}

main()
    .catch(e => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
