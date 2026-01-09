
import { PrismaClient } from '../../../packages/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log("Creating Admin User...");
    const hashedPassword = await bcrypt.hash('admin123', 10);

    try {
        const user = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {},
            create: {
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
                name: 'Admin'
            }
        });
        console.log("Admin user created/updated:", user.id);
    } catch (e) {
        console.error("Error creating admin:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
