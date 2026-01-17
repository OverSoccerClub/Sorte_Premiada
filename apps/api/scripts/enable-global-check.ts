import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableGlobalCheck() {
    try {
        // Find the 2x1000 game
        const game = await prisma.game.findFirst({
            where: { name: '2x1000' }
        });

        if (!game) {
            console.error('❌ Game 2x1000 not found!');
            process.exit(1);
        }

        console.log('📋 Current rules:', JSON.stringify(game.rules, null, 2));

        // Update the rules to enable globalCheck
        const updatedRules = {
            ...(game.rules as any || {}),
            globalCheck: true
        };

        await prisma.game.update({
            where: { id: game.id },
            data: { rules: updatedRules }
        });

        console.log('✅ Successfully enabled globalCheck for 2x1000!');
        console.log('📋 New rules:', JSON.stringify(updatedRules, null, 2));

    } catch (error) {
        console.error('❌ Error updating game:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

enableGlobalCheck();
