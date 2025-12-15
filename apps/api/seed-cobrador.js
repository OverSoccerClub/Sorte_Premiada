const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Cobrador...');

    const password = await bcrypt.hash('1234', 10);
    const pin = '1234';

    const cobrador = await prisma.user.upsert({
        where: { username: 'cobrador01' },
        update: {},
        create: {
            username: 'cobrador01',
            password,
            securityPin: pin,
            role: 'COBRADOR',
            name: 'Cobrador Teste',
        },
    });

    console.log('✅ Cobrador created!');
    console.log('👤 Username: cobrador01');
    console.log('🔑 Password: 1234');
    console.log('🔢 PIN: 1234');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
