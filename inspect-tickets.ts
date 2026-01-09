
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching 2x1000 tickets...");
    const tickets = await prisma.ticket.findMany({
        where: { gameType: '2x1000' },
        take: 20,
        orderBy: { createdAt: 'desc' }
    });

    if (tickets.length === 0) {
        console.log("No 2x1000 tickets found.");
        return;
    }

    tickets.forEach(t => {
        console.log(`Ticket ID: ${t.id} | Hash: ${t.hash} | CreatedAt: ${t.createdAt}`);
        console.log(`Numbers: ${JSON.stringify(t.numbers)}`);
        console.log("---");
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
