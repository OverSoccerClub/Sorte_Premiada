
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const games = await prisma.game.findMany({
        select: { id: true, name: true }
    });
    console.log('GAMES:', JSON.stringify(games, null, 2));

    const todayStr = new Date().toISOString().split('T')[0];
    const countToday = await prisma.ticket.count({
        where: {
            createdAt: {
                gte: new Date(todayStr + 'T00:00:00.000Z')
            }
        }
    });
    console.log(`TOTAL TICKETS TODAY (UTC 00:00+): ${countToday}`);

    const sampleTickets = await prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { game: { select: { name: true } } }
    });
    console.log('LAST 5 TICKETS:', JSON.stringify(sampleTickets.map(t => ({
        id: t.id,
        createdAt: t.createdAt,
        gameName: t.game?.name,
        status: t.status
    })), null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
