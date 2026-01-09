import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting complete database seed...\n');

    // ============================================
    // 1. CREATE MASTER USER (sem companyId)
    // ============================================
    console.log('👑 Creating MASTER user...');
    const masterPassword = await bcrypt.hash('master123', 10);
    const master = await prisma.user.upsert({
        where: { username: 'master' },
        update: {
            password: masterPassword,
            role: Role.MASTER,
            name: 'Super Admin',
        },
        create: {
            username: 'master',
            password: masterPassword,
            name: 'Super Admin',
            role: Role.MASTER,
            // companyId: null (MASTER não tem empresa)
        },
    });
    console.log('✅ MASTER user created:', master.username);

    // ============================================
    // 2. CREATE COMPANIES
    // ============================================
    console.log('\n🏢 Creating companies...');

    const company1 = await prisma.company.upsert({
        where: { slug: 'imperial' },
        update: {},
        create: {
            slug: 'imperial',
            companyName: 'Imperial',
            slogan: 'A sorte está do seu lado',
            isActive: true,
            subscriptionPlan: 'PRO',
        },
    });
    console.log('✅ Company created:', company1.companyName);

    const company2 = await prisma.company.upsert({
        where: { slug: 'perseveranca' },
        update: {},
        create: {
            slug: 'perseveranca',
            companyName: 'A Perseverança',
            slogan: 'Cambista Edition',
            initials: 'AP', // Iniciais para códigos de ativação
            isActive: true,
            subscriptionPlan: 'BASIC',
        },
    });
    console.log('✅ Company created:', company2.companyName);

    // ============================================
    // 3. CREATE ADMIN USERS (com companyId)
    // ============================================
    console.log('\n👤 Creating ADMIN users...');

    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin1 = await prisma.user.upsert({
        where: { username: 'Imperial' },
        update: {
            password: adminPassword,
            role: Role.ADMIN,
            companyId: company1.id,
        },
        create: {
            username: 'Imperial',
            password: adminPassword,
            name: 'Admin Imperial',
            role: Role.ADMIN,
            companyId: company1.id,
        },
    });
    console.log('✅ ADMIN created:', admin1.username, '(Company:', company1.companyName + ')');

    const admin2 = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: adminPassword,
            role: Role.ADMIN,
            companyId: company2.id,
        },
        create: {
            username: 'admin',
            password: adminPassword,
            name: 'Admin Perseverança',
            role: Role.ADMIN,
            companyId: company2.id,
        },
    });
    console.log('✅ ADMIN created:', admin2.username, '(Company:', company2.companyName + ')');

    // ============================================
    // 4. CREATE AREAS (com companyId)
    // ============================================
    console.log('\n📍 Creating areas...');

    const area1 = await prisma.area.create({
        data: {
            name: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            companyId: company1.id,
        },
    });
    console.log('✅ Area created:', area1.name, '(Company:', company1.companyName + ')');

    const area2 = await prisma.area.create({
        data: {
            name: 'Zona Norte',
            city: 'São Paulo',
            state: 'SP',
            companyId: company1.id,
        },
    });
    console.log('✅ Area created:', area2.name, '(Company:', company1.companyName + ')');

    const area3 = await prisma.area.create({
        data: {
            name: 'Centro',
            city: 'Rio de Janeiro',
            state: 'RJ',
            companyId: company2.id,
        },
    });
    console.log('✅ Area created:', area3.name, '(Company:', company2.companyName + ')');

    // ============================================
    // 5. CREATE GAMES (com companyId)
    // ============================================
    console.log('\n🎮 Creating games...');

    const game2x1000_c1 = await prisma.game.upsert({
        where: { id: '2x1000-imperial' },
        update: {},
        create: {
            id: '2x1000-imperial',
            name: '2x1000',
            rules: { type: 'RAPID', numbers: 4, range: 10000 },
            price: 10.00,
            extractionTimes: ["08:15", "11:30", "16:00"],
            companyId: company1.id,
        },
    });
    console.log('✅ Game created:', game2x1000_c1.name, '(Company:', company1.companyName + ')');

    const gameJB_c1 = await prisma.game.upsert({
        where: { id: 'jb-imperial' },
        update: {},
        create: {
            id: 'jb-imperial',
            name: 'Jogo do Bicho',
            rules: { type: 'BICHO' },
            price: 10.00,
            companyId: company1.id,
        },
    });
    console.log('✅ Game created:', gameJB_c1.name, '(Company:', company1.companyName + ')');

    const game2x1000_c2 = await prisma.game.upsert({
        where: { id: '2x1000-perseveranca' },
        update: {},
        create: {
            id: '2x1000-perseveranca',
            name: '2x1000',
            rules: { type: 'RAPID', numbers: 4, range: 10000 },
            price: 10.00,
            extractionTimes: ["08:15", "11:30", "16:00"],
            companyId: company2.id,
        },
    });
    console.log('✅ Game created:', game2x1000_c2.name, '(Company:', company2.companyName + ')');

    // ============================================
    // 6. CREATE SAMPLE CAMBISTAS (com companyId e areaId)
    // ============================================
    console.log('\n💼 Creating sample CAMBISTA users...');

    const cambistaPassword = await bcrypt.hash('cambista123', 10);

    const cambista1 = await prisma.user.create({
        data: {
            username: 'cambista1',
            password: cambistaPassword,
            name: 'João Silva',
            role: Role.CAMBISTA,
            companyId: company1.id,
            areaId: area1.id,
            salesLimit: 5000,
        },
    });
    console.log('✅ CAMBISTA created:', cambista1.username, '(Area:', area1.name + ')');

    const cambista2 = await prisma.user.create({
        data: {
            username: 'cambista2',
            password: cambistaPassword,
            name: 'Maria Santos',
            role: Role.CAMBISTA,
            companyId: company1.id,
            areaId: area2.id,
            salesLimit: 3000,
        },
    });
    console.log('✅ CAMBISTA created:', cambista2.username, '(Area:', area2.name + ')');

    // ============================================
    // 7. CREATE SAMPLE COBRADORES (com companyId e areaId)
    // ============================================
    console.log('\n🎯 Creating sample COBRADOR users...');

    const cobradorPassword = await bcrypt.hash('cobrador123', 10);

    const cobrador1 = await prisma.user.create({
        data: {
            username: '123456', // Matrícula
            password: cobradorPassword,
            name: 'Pedro Costa',
            role: Role.COBRADOR,
            companyId: company1.id,
            areaId: area1.id,
            securityPin: '1234',
            usernameExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h
            securityPinExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
    });
    console.log('✅ COBRADOR created:', cobrador1.username, '(Area:', area1.name + ')');

    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📋 Summary:');
    console.log('   - 1 MASTER user (no company)');
    console.log('   - 2 Companies');
    console.log('   - 2 ADMIN users (with companies)');
    console.log('   - 3 Areas');
    console.log('   - 3 Games');
    console.log('   - 2 CAMBISTA users');
    console.log('   - 1 COBRADOR user');
    console.log('\n🔑 Default Credentials:');
    console.log('   MASTER:   master / master123');
    console.log('   ADMIN:    Imperial / admin123');
    console.log('   ADMIN:    admin / admin123');
    console.log('   CAMBISTA: cambista1 / cambista123');
    console.log('   COBRADOR: 123456 / cobrador123 (PIN: 1234)');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error during seeding:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
