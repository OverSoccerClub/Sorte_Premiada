import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('admin', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password,
            name: 'Administrador',
            role: Role.ADMIN,
        },
    });
    console.log({ admin });

    const game2x1000 = await prisma.game.upsert({
        where: { id: '1e18bd40-d875-42a6-b0c8-8dc2e260d098' },
        update: {},
        create: {
            id: '1e18bd40-d875-42a6-b0c8-8dc2e260d098',
            name: '2x1000',
            rules: { type: 'RAPID', numbers: 4, range: 10000 },
            price: 10.00,
            extractionTimes: ["08:15", "11:30", "16:00"]
        },
    });
    console.log({ game2x1000 });

    const gameJB = await prisma.game.upsert({
        where: { id: 'jb-default-game-id' },
        update: {},
        create: {
            id: 'jb-default-game-id',
            name: 'Jogo do Bicho',
            rules: { type: 'BICHO' },
            price: 10.00,
        },
    });
    console.log({ gameJB });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
