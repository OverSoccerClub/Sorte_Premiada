import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password,
            role: Role.ADMIN,
        },
    });
    console.log({ admin });

    const game2x500 = await prisma.game.upsert({
        where: { id: 'game-2x500-default' }, // ID must be UUID-like or valid. Schema says @default(uuid()). I can provide a fixed string if it valid? uuid is string.
        // Actually, upsert needs a unique field. 'id' is @id.
        // But I don't know the ID if it was auto-generated.
        // I can't upsert by 'name' because it's not unique in schema (unless I missed it).
        // I'll try to findFirst by name, if not create.
        update: {},
        create: {
            name: '2x500',
            rules: { numbers: 4, range: 10000 },
        },
    });
    // Wait, upsert requires a unique constraint. ID is unique.
    // If I use a fixed UUID, it works.
    // Let's use a fixed UUID for the default game.
    const fixedId = "11111111-1111-1111-1111-111111111111";

    const game = await prisma.game.upsert({
        where: { id: fixedId },
        update: {},
        create: {
            id: fixedId,
            name: '2x500',
            rules: { numbers: 4, range: 10000 },
        },
    });
    console.log({ game });
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
