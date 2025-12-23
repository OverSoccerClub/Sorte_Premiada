const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Games...');

    let game = await prisma.game.upsert({
        where: { name: '2x1000' },
        update: {},
        create: {
            name: '2x1000',
            description: 'Sorteio diário. Ganhe 2x R$ 1000,00',
            status: 'ACTIVE',
            type: '2x1000',
            minBetAmount: 2.00,
            maxBetAmount: 100.00,
            prizeMultiplier: 0,
            rules: {
                maxNumbers: 4,
                rangeStats: [0, 9999],
                type: '2x1000'
            }
        }
    })

    if (game) {
        console.log(`✅ Game '2x1000' created! ID: ${game.id}`);
    } else {
        console.log(`ℹ️ Game '2x1000' already exists. ID: ${game.id}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
