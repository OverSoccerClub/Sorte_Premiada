import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const usersWithToken = await prisma.user.count({
        where: {
            pushToken: {
                not: null
            }
        }
    });

    console.log(`Users with push tokens: ${usersWithToken}`);

    const sample = await prisma.user.findFirst({
        where: { pushToken: { not: null } },
        select: { username: true, pushToken: true }
    });

    if (sample) {
        console.log(`Sample user: ${sample.username}, Token: ${sample.pushToken}`);
    } else {
        console.log("No users found with tokens.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
