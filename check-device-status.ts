
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
    const deviceId = '294808757e1cca86';
    const username = 'joao.innovarecode';

    console.log(`Checking device ${deviceId} and user ${username}...`);

    const device = await prisma.posTerminal.findFirst({
        where: { deviceId: deviceId }
    });

    console.log("Device Record:", device);

    const user = await prisma.user.findUnique({
        where: { username: username }
    });

    console.log("User Record:", user ? { ...user, password: '[HIDDEN]' } : "Not Found");

    // Check for any recent devices
    const recentDevices = await prisma.posTerminal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log("Recent Devices:", recentDevices);

}

main().catch(console.error).finally(() => prisma.$disconnect());
