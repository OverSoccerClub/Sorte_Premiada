
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Jogo do Bicho game...");
    const fixedId = "22222222-2222-2222-2222-222222222222";

    try {
        const game = await prisma.game.upsert({
            where: { id: fixedId },
            update: {},
            create: {
                id: fixedId,
                name: 'Jogo do Bicho',
                rules: {
                    modalities: ['GRUPO', 'DEZENA', 'CENTENA', 'MILHAR'],
                    animals: 25,
                    description: 'Tradicional Jogo do Bicho'
                },
            },
        });
        console.log("Success! Game created/updated:", game);
    } catch (e) {
        console.error("Error seeding game:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
