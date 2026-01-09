
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Tickets 2x1000 (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let gameId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // 1. Login as Admin
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ username: 'admin', password: 'admin123' })
            .expect(201); // Created

        authToken = loginResponse.body.access_token;
        expect(authToken).toBeDefined();

        // 2. Create 2x1000 Game
        const gameResponse = await request(app.getHttpServer())
            .post('/games')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Test 2x1000 Game',
                rules: { type: '2x1000' }
            })
            .expect(201);

        gameId = gameResponse.body.id;
        expect(gameId).toBeDefined();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should create a ticket with 4 manual numbers', async () => {
        const numbers = [1000, 2000, 3000, 4000];
        const res = await request(app.getHttpServer())
            .post('/tickets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                gameId,
                gameType: '2x1000',
                numbers,
                amount: 10
            })
            .expect(201);

        expect(res.body.numbers).toEqual(numbers);
    });

    it('should fail to create a ticket with duplicate numbers', async () => {
        const numbers = [1000, 5000, 6000, 7000]; // 1000 is already sold
        await request(app.getHttpServer())
            .post('/tickets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                gameId,
                gameType: '2x1000',
                numbers,
                amount: 10
            })
            .expect(500); // Or 400 dependent on how error is handled globally. Service throws Error so typically 500 unless mapped.
    });

    it('should create a ticket with auto-pick logic (empty numbers)', async () => {
        const res = await request(app.getHttpServer())
            .post('/tickets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                gameId,
                gameType: '2x1000',
                amount: 10
                // numbers missing -> auto pick
            })
            .expect(201);

        expect(res.body.numbers).toHaveLength(4);
        // Verify none of them are 1000, 2000, 3000, 4000
        const oldNumbers = [1000, 2000, 3000, 4000];
        const newNumbers = res.body.numbers;
        const collision = newNumbers.filter(n => oldNumbers.includes(n));
        expect(collision).toEqual([]);
    });

    it('should create a ticket with explicit auto-pick (empty array)', async () => {
        const res = await request(app.getHttpServer())
            .post('/tickets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                gameId,
                gameType: '2x1000',
                numbers: [],
                amount: 10
            })
            .expect(201);

        expect(res.body.numbers).toHaveLength(4);
    });
});
