
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking 2x1000 game configuration...");

    const games = await prisma.game.findMany({
        where: { name: { contains: '2x1000' } }
    });

    if (games.length === 0) {
        console.log("No game found with name containing '2x1000'");
    } else {
        games.forEach(g => {
            console.log(`Game ID: ${g.id}`);
            console.log(`Name: ${g.name}`);
            console.log(`Extraction Times:`, g.extractionTimes);
            console.log(`Configured Cutoff (Implicit in code): 10 minutes`);
            console.log("------------------------------------------------");
        });
    }

    await prisma.$disconnect();
}

main().catch(console.error);
