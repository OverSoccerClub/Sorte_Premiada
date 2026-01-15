
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log("Starting backfill for DailyClose companyId...");

    // Fetch all DailyCloses that might need updating (or just all to be safe)
    // To be efficient, let's fetch those where companyId is null first (if possible) or just all and check in memory.
    const closes = await prisma.dailyClose.findMany({
        where: {
            companyId: null
        },
        include: {
            closedByUser: {
                select: { id: true, companyId: true }
            }
        }
    });

    console.log(`Found ${closes.length} DailyClose records without companyId.`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const close of closes) {
        if (close.closedByUser && close.closedByUser.companyId) {
            try {
                await prisma.dailyClose.update({
                    where: { id: close.id },
                    data: { companyId: close.closedByUser.companyId }
                });
                updatedCount++;
                if (updatedCount % 50 === 0) console.log(`Updated ${updatedCount} records...`);
            } catch (error) {
                console.error(`Failed to update close ${close.id}:`, error);
                failedCount++;
            }
        } else {
            console.warn(`Skipping close ${close.id}: User ${close.closedByUserId} has no companyId.`);
            failedCount++;
        }
    }

    console.log(`Backfill complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Failed/Skipped: ${failedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
