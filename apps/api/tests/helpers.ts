import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

export class TestHelper {
    private static app: INestApplication;
    private static moduleRef: TestingModule;

    static async setupTestApp(): Promise<INestApplication> {
        if (this.app) {
            return this.app;
        }

        this.moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        this.app = this.moduleRef.createNestApplication();
        await this.app.init();

        return this.app;
    }

    static async closeTestApp(): Promise<void> {
        if (this.app) {
            await this.app.close();
            this.app = undefined as any;
            this.moduleRef = undefined as any;
        }
    }

    static getApp(): INestApplication {
        return this.app;
    }

    /**
     * Login e retorna o token JWT
     */
    static async login(username: string, password: string): Promise<string> {
        const response = await request(this.app.getHttpServer())
            .post('/auth/login')
            .send({ username, password })
            .expect(200);

        return response.body.access_token;
    }

    /**
     * Cria um usuário de teste
     */
    static async createTestUser(
        token: string,
        userData: any
    ): Promise<any> {
        const response = await request(this.app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send(userData)
            .expect(201);

        return response.body;
    }

    /**
     * Deleta um usuário de teste
     */
    static async deleteTestUser(token: string, userId: string): Promise<void> {
        await request(this.app.getHttpServer())
            .delete(`/users/${userId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    }
}

// Dados de teste padrão (carregados de variáveis de ambiente)
export const TEST_CREDENTIALS = {
    MASTER: {
        username: process.env.TEST_MASTER_USERNAME || 'master',
        password: process.env.TEST_MASTER_PASSWORD || 'master123',
    },
    COMPANY_A_ADMIN: {
        username: process.env.TEST_COMPANY_A_USERNAME || 'admin',
        password: process.env.TEST_COMPANY_A_PASSWORD || 'admin123',
    },
    COMPANY_B_ADMIN: {
        username: process.env.TEST_COMPANY_B_USERNAME || 'admin_b',
        password: process.env.TEST_COMPANY_B_PASSWORD || 'admin123',
    },
};

export const TEST_COMPANY_IDS = {
    COMPANY_A: process.env.TEST_COMPANY_A_ID || 'test-company-a-id',
    COMPANY_B: process.env.TEST_COMPANY_B_ID || 'test-company-b-id',
};
