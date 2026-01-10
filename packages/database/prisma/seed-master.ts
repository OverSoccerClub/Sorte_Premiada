import { PrismaClient, Role, LicenseStatus, SubscriptionPlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Master Seed...');

    // 1. Create Default Company
    console.log('🏢 Checking/Creating Default Company...');
    const company = await prisma.company.upsert({
        where: { slug: 'default' },
        update: {}, // No updates if exists
        create: {
            slug: 'default',
            companyName: 'A Perseverança',
            slogan: 'Cambista Edition',
            licenseStatus: LicenseStatus.ACTIVE,
            subscriptionPlan: SubscriptionPlan.ENTERPRISE,
            maxUsers: 100,
            maxActiveDevices: 50,
            isActive: true,
            initials: 'AP'
        }
    });
    console.log(`✅ Company ready: ${company.companyName} (${company.id})`);

    // 2. Create MASTER User
    console.log('👤 Creating MASTER User...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const masterUser = await prisma.user.upsert({
        where: { username: 'master' },
        update: {
            // Ensure these are set even if user exists
            companyId: company.id,
            role: Role.MASTER,
            password: hashedPassword, // Reset password just in case
            isActive: true
        },
        create: {
            username: 'master',
            password: hashedPassword,
            name: 'Master Admin',
            email: 'master@innobet.com', // Fake email
            role: Role.MASTER,
            companyId: company.id,
            isActive: true
        }
    });

    console.log(`✅ User MASTER created/updated!`);
    console.log(`👉 Username: master`);
    console.log(`👉 Password: password123`);
    console.log(`👉 Company: ${company.companyName}`);

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
