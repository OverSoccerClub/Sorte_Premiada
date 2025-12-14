
import { PrismaClient } from '@prisma/client';

// Hardcoding for diagnostic purposes to bypass env loading issues
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://admin:password@localhost:5432/megasena?schema=public"
        },
    },
});

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Total Users:', users.length);

        // Check various casing for role to be sure
        const allRoles = users.map(u => u.role);
        console.log('Available Roles:', [...new Set(allRoles)]);

        const cambistas = users.filter((u: any) => u.role === 'CAMBISTA');
        console.log('Cambistas Count (CAMBISTA):', cambistas.length);

        if (cambistas.length > 0) {
            console.log('First Cambista Example:', JSON.stringify(cambistas[0], null, 2));
        } else {
            console.log('No users with role CAMBISTA found.');
            console.log('Sample user:', JSON.stringify(users[0], null, 2));
        }
    } catch (error) {
        console.error('Error querying users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
