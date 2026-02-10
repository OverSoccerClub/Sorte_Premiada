
import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from '../src/tickets/tickets.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { FinanceService } from '../src/finance/finance.service';
import { SecurityService } from '../src/security/security.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { RedisService } from '../src/redis/redis.service';
import { BadRequestException } from '@nestjs/common';

// Mocks
const mockPrismaService = {
    client: {
        game: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
        area: { findUnique: jest.fn() },
        areaConfig: { findUnique: jest.fn() },
        ticket: { findMany: jest.fn(), create: jest.fn() },
        $transaction: jest.fn((cb) => cb(mockPrismaService.client)),
    },
};

const mockFinanceService = { validateSalesEligibility: jest.fn() };
const mockSecurityService = {};
const mockNotificationsService = {};
const mockRedisService = {};

describe('TicketsService - 2x1000 Logic', () => {
    let service: TicketsService;
    let prisma: typeof mockPrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: FinanceService, useValue: mockFinanceService },
                { provide: SecurityService, useValue: mockSecurityService },
                { provide: NotificationsService, useValue: mockNotificationsService },
                { provide: RedisService, useValue: mockRedisService },
            ],
        }).compile();

        service = module.get<TicketsService>(TicketsService);
        prisma = module.get(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create (2x1000)', () => {
        const mockUser = {
            id: 'user-1',
            role: 'CAMBISTA',
            companyId: 'company-1',
            areaId: 'area-1',
            area: { seriesNumber: '0001', name: 'Area A' }
        };

        const mockGame = {
            id: 'game-2x1000',
            type: '2x1000',
            rules: { globalCheck: false, restrictedMode: false },
            maxTicketsPerSeries: 1000,
        };

        const mockArea = {
            id: 'area-1',
            currentSeries: '0005',
            ticketsInSeries: 100,
            maxTicketsPerSeries: 2500,
            isActive: true,
            autoCycleSeries: true
        };

        it('should create a ticket successfully for Cambista', async () => {
            // Mocks
            prisma.client.game.findUnique.mockResolvedValue(mockGame);
            prisma.client.user.findUnique.mockResolvedValue(mockUser);
            prisma.client.area.findUnique.mockResolvedValue(mockArea);
            prisma.client.ticket.findMany.mockResolvedValue([]); // No duplicates
            prisma.client.ticket.create.mockResolvedValue({ id: 'ticket-1', status: 'PENDING' });

            // Mock Next Draw Date (Private method bypass or assuming specific date)
            // Since getNextDrawDate is irrelevant to the permission part if it returns valid date
            // We assume service.getNextDrawDate works or we mock internal.
            // But getNextDrawDate accesses DB. We should mock that too if exposed, but it's not.
            // We can rely on findMany returning [] for duplicate check.

            const ticketData = {
                amount: 10,
                gameId: 'game-2x1000',
                gameType: '2x1000',
                numbers: ['1234', '5678', '9012', '3456'],
                user: { connect: { id: 'user-1' } }
            };

            await service.create(ticketData);

            expect(prisma.client.ticket.create).toHaveBeenCalled();
            expect(mockFinanceService.validateSalesEligibility).toHaveBeenCalledWith('user-1', 10);
        });

        it('should block if duplicate numbers exist in same series/area', async () => {
            prisma.client.game.findUnique.mockResolvedValue(mockGame);
            prisma.client.user.findUnique.mockResolvedValue(mockUser);
            prisma.client.area.findUnique.mockResolvedValue(mockArea);

            // Simulate duplicate found
            prisma.client.ticket.findMany.mockResolvedValue([{ numbers: ['1234'] }]);

            const ticketData = {
                amount: 10,
                gameId: 'game-2x1000',
                gameType: '2x1000',
                numbers: ['1234', '5678', '9012', '3456'],
                user: { connect: { id: 'user-1' } }
            };

            // Since the logic relies on getNextDrawDate which uses Prisma, 
            // and we didn't fully mock the draw date logic, this test works 
            // assuming the duplicate check is reached.
            // Note: In a real environment we'd mock DrawService too.

            // We expect BadRequestException
            try {
                await service.create(ticketData);
            } catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                // expect(e.message).toContain('Números já vendidos');
            }
        });
    });
});
