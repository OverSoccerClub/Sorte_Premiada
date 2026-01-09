import request from 'supertest';
import { TestHelper, TEST_CREDENTIALS, TEST_COMPANY_IDS } from '../helpers';

describe('Data Isolation (E2E)', () => {
    let app: any;
    let masterToken: string;
    let companyAToken: string;
    let companyBToken: string;

    beforeAll(async () => {
        app = await TestHelper.setupTestApp();

        // Login com diferentes usuários
        masterToken = await TestHelper.login(
            TEST_CREDENTIALS.MASTER.username,
            TEST_CREDENTIALS.MASTER.password
        );

        companyAToken = await TestHelper.login(
            TEST_CREDENTIALS.COMPANY_A_ADMIN.username,
            TEST_CREDENTIALS.COMPANY_A_ADMIN.password
        );

        companyBToken = await TestHelper.login(
            TEST_CREDENTIALS.COMPANY_B_ADMIN.username,
            TEST_CREDENTIALS.COMPANY_B_ADMIN.password
        );
    });

    afterAll(async () => {
        await TestHelper.closeTestApp();
    });

    describe('Users Isolation', () => {
        it('Company A should only see its own users', async () => {
            const response = await request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${companyAToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // Todos os usuários devem ser da Company A
            response.body.forEach((user: any) => {
                expect(user.companyId).toBe(TEST_COMPANY_IDS.COMPANY_A);
            });
        });

        it('Company B should only see its own users', async () => {
            const response = await request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${companyBToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // Todos os usuários devem ser da Company B
            response.body.forEach((user: any) => {
                expect(user.companyId).toBe(TEST_COMPANY_IDS.COMPANY_B);
            });
        });

        it('Company A should NOT access Company B data with targetCompanyId', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users?targetCompanyId=${TEST_COMPANY_IDS.COMPANY_B}`)
                .set('Authorization', `Bearer ${companyAToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('MASTER');
        });

        it('MASTER should access any company data with targetCompanyId', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users?targetCompanyId=${TEST_COMPANY_IDS.COMPANY_A}`)
                .set('Authorization', `Bearer ${masterToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Games Isolation', () => {
        it('Company A should only see its own games', async () => {
            const response = await request(app.getHttpServer())
                .get('/games')
                .set('Authorization', `Bearer ${companyAToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // Todos os jogos devem ser da Company A
            response.body.forEach((game: any) => {
                expect(game.companyId).toBe(TEST_COMPANY_IDS.COMPANY_A);
            });
        });
    });

    describe('Areas Isolation', () => {
        it('Company A should only see its own areas', async () => {
            const response = await request(app.getHttpServer())
                .get('/areas')
                .set('Authorization', `Bearer ${companyAToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // Todas as áreas devem ser da Company A
            response.body.forEach((area: any) => {
                expect(area.companyId).toBe(TEST_COMPANY_IDS.COMPANY_A);
            });
        });
    });

    describe('Tickets Isolation', () => {
        it('Company A should only see its own tickets', async () => {
            const response = await request(app.getHttpServer())
                .get('/tickets')
                .set('Authorization', `Bearer ${companyAToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // Todos os tickets devem ser da Company A
            response.body.forEach((ticket: any) => {
                expect(ticket.companyId).toBe(TEST_COMPANY_IDS.COMPANY_A);
            });
        });
    });

    describe('Draws Isolation', () => {
        it('Company A should only see its own draws', async () => {
            const response = await request(app.getHttpServer())
                .get('/draws')
                .set('Authorization', `Bearer ${companyAToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // Todos os sorteios devem ser da Company A
            response.body.forEach((draw: any) => {
                expect(draw.companyId).toBe(TEST_COMPANY_IDS.COMPANY_A);
            });
        });
    });
});
