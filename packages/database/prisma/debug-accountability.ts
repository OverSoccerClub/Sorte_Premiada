import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAccountability(username: string) {
    const user = await prisma.user.findFirst({
        where: { username },
        include: { area: true }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User:', { id: user.id, username: user.username, createdAt: user.createdAt });

    const lastVerifiedClose = await prisma.dailyClose.findFirst({
        where: { closedByUserId: user.id, status: 'VERIFIED' },
        orderBy: { date: 'desc' }
    });

    const lastVerifiedAt = lastVerifiedClose ? lastVerifiedClose.createdAt : user.createdAt;
    const lastVerifiedLogicalDate = lastVerifiedClose ? lastVerifiedClose.date : null;

    console.log('Last Verified Close:', {
        id: lastVerifiedClose?.id,
        createdAt: lastVerifiedClose?.createdAt,
        logicalDate: lastVerifiedClose?.date,
        status: lastVerifiedClose?.status
    });

    const tickets = await prisma.ticket.findMany({
        where: {
            userId: user.id,
            createdAt: { gt: lastVerifiedAt },
            status: { not: 'CANCELLED' }
        },
        select: { id: true, amount: true, createdAt: true }
    });

    console.log(`Found ${tickets.length} tickets since last verified date (${lastVerifiedAt.toISOString()}):`);
    tickets.forEach(t => console.log(`- Ticket ${t.id}: R$ ${t.amount} at ${t.createdAt.toISOString()}`));

    const totalSales = tickets.reduce((sum, t) => sum + Number(t.amount), 0);
    console.log('Computed Total Sales:', totalSales);
}

debugAccountability('ANTONIO.PERSEVERANCA')
    .catch(console.error)
    .finally(() => prisma.$disconnect());
