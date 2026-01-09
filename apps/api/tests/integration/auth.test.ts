import request from 'supertest';
import { TestHelper, TEST_CREDENTIALS } from '../helpers';

describe('Authentication (E2E)', () => {
    let app: any;

    beforeAll(async () => {
        app = await TestHelper.setupTestApp();
    });

    afterAll(async () => {
        await TestHelper.closeTestApp();
    });

    describe('POST /auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: TEST_CREDENTIALS.MASTER.username,
                    password: TEST_CREDENTIALS.MASTER.password,
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('access_token');
            expect(typeof response.body.access_token).toBe('string');
        });

        it('should reject login with invalid username', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'invalid_user',
                    password: 'any_password',
                });

            expect(response.status).toBe(401);
        });

        it('should reject login with invalid password', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: TEST_CREDENTIALS.MASTER.username,
                    password: 'wrong_password',
                });

            expect(response.status).toBe(401);
        });

        it('should reject login with missing credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({});

            expect(response.status).toBe(400);
        });
    });
});
