const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting manual seed...');

    const password = await bcrypt.hash('admin', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: password,
            role: 'ADMIN',
        },
        create: {
            username: 'admin',
            password,
            role: 'ADMIN',
            name: 'Administrador',
        },
    });

    console.log('✅ Admin user created/verified!');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
