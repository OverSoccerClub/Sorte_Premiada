
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from packages/database/.env
// Script is in packages/database/prisma/
// ../ (prisma) -> ../ (database)
const envPath = path.resolve(__dirname, '../../.env');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function backfillDailyCloses() {
    console.log("--- Starting backfill for DailyClose companyId ---");
    const closes = await prisma.dailyClose.findMany({
        where: { companyId: null },
        include: { closedByUser: { select: { id: true, companyId: true } } }
    });

    console.log(`Found ${closes.length} DailyClose records without companyId.`);

    let updatedCount = 0;
    for (const close of closes) {
        if (close.closedByUser && close.closedByUser.companyId) {
            await prisma.dailyClose.update({
                where: { id: close.id },
                data: { companyId: close.closedByUser.companyId }
            });
            updatedCount++;
        }
    }
    console.log(`Updated ${updatedCount} DailyClose records.`);
}

async function backfillTickets() {
    console.log("--- Starting backfill for Ticket companyId ---");
    const tickets = await prisma.ticket.findMany({
        where: { companyId: null },
        include: { user: { select: { id: true, companyId: true } } }
    });

    console.log(`Found ${tickets.length} Ticket records without companyId.`);

    let updatedCount = 0;
    for (const ticket of tickets) {
        if (ticket.user && ticket.user.companyId) {
            await prisma.ticket.update({
                where: { id: ticket.id },
                data: { companyId: ticket.user.companyId }
            });
            updatedCount++;
            if (updatedCount % 500 === 0) console.log(`Updated ${updatedCount} tickets...`);
        }
    }
    console.log(`Updated ${updatedCount} Ticket records.`);
}

async function main() {
    await backfillDailyCloses();
    await backfillTickets();
    console.log("Backfill complete.");
}

main()
    .catch((e) => {
        console.error("Backfill failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
