
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Loteria Tradicional game...");
    const fixedId = "22222222-2222-2222-2222-222222222222";

    try {
        const game = await prisma.game.upsert({
            where: { id: fixedId },
            update: {
                name: 'Loteria Tradicional',
                prizeGrupo: 18,
                prizeDezena: 60,
                prizeCentena: 600,
                prizeMilhar: 4000,
            },
            create: {
                id: fixedId,
                name: 'Loteria Tradicional',
                rules: {
                    type: 'BICHO',
                    modalities: ['GRUPO', 'DEZENA', 'CENTENA', 'MILHAR'],
                    animals: 25,
                    description: 'Loteria Tradicional Brasileira'
                },
                prizeGrupo: 18,
                prizeDezena: 60,
                prizeCentena: 600,
                prizeMilhar: 4000,
            },
        });
        console.log("Success! Loteria Tradicional created/updated:", game);
    } catch (e) {
        console.error("Error seeding game:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
