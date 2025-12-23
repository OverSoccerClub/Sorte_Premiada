
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding 2x1000 game...");
    const fixedId = "11111111-1111-1111-1111-111111111111";

    try {
        const game = await prisma.game.upsert({
            where: { id: fixedId },
            update: {},
            create: {
                id: fixedId,
                name: '2x1000',
                rules: { numbers: 4, range: 10000 },
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
