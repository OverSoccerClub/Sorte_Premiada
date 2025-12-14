const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Games...');

    const game = await prisma.game.upsert({
        where: { name: '2x500' },
        update: {},
        create: {
            name: '2x500',
            description: 'Escolha 4 milhares de 0000 a 9999',
            type: 'RAPID',
            status: 'ACTIVE',
            price: 10.00,
            drawTime: '20:00', // Exemplary draw time
        },
    });

    console.log(`✅ Game '2x500' seeded with ID: ${game.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
