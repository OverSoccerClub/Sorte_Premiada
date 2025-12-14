const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Games...');

    let game = await prisma.game.findFirst({
        where: { name: '2x500' },
    });

    if (!game) {
        game = await prisma.game.create({
            data: {
                name: '2x500',
                rules: {
                    description: 'Escolha 4 milhares de 0000 a 9999',
                    type: 'RAPID',
                    status: 'ACTIVE',
                    price: 10.00,
                    drawTime: '20:00',
                },
            },
        });
        console.log(`✅ Game '2x500' created! ID: ${game.id}`);
    } else {
        console.log(`ℹ️ Game '2x500' already exists. ID: ${game.id}`);
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
