
import { Test, TestingModule } from '@nestjs/testing';
import { DrawsService } from '../src/draws/draws.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

// Mock Ticket Structure
interface MockTicket {
    id: string;
    userId: string;
    amount: number;
    numbers: string[]; // ["H", "D", "A", ...]
    status: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED';
    possiblePrize: number;
}

const mockPrisma = {
    draw: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    ticket: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
    transaction: {
        create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
};

const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
};

describe('DrawsService - Palpita Ai Logic', () => {
    let service: DrawsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DrawsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();

        service = module.get<DrawsService>(DrawsService);
        jest.clearAllMocks();
    });

    it('should calculate prizes correctly for Palpita Ai (1500 tickets)', async () => {
        // SCENARIO: 
        // 1500 Tickets sold at R$ 10.00 each = R$ 15,000.00 Revenue
        // Prize Pool = 70% = R$ 10,500.00
        //
        // Breakdown:
        // 14 Hits (80%): R$ 8,400.00
        // 13 Hits (15%): R$ 1,575.00
        // 12 Hits (5%):  R$ 525.00

        // WINNING RESULT: All "H" (Home) for simplicity
        const winningResult = Array(14).fill('H');

        // DRAW MOCK
        const mockDraw = {
            id: 'draw-1',
            gameId: 'game-palpita',
            drawDate: new Date(),
            game: { type: 'PAIPITA_AI' },
            matches: winningResult.map((res, i) => ({
                matchOrder: i + 1,
                result: res
            }))
        };

        // TICKETS MOCK
        // 1 Winner with 14 hits
        // 1 Winner with 13 hits
        // 1 Winner with 12 hits
        // 1497 Losers
        const tickets: MockTicket[] = [];

        // 1. Winner 14 Hits
        tickets.push({
            id: 'ticket-14-hits', userId: 'u1', amount: 10, status: 'PENDING', possiblePrize: 0,
            numbers: [...winningResult]
        });

        // 2. Winner 13 Hits (Change last to wrong)
        const t13 = [...winningResult];
        t13[13] = 'A'; // Wrong
        tickets.push({
            id: 'ticket-13-hits', userId: 'u2', amount: 10, status: 'PENDING', possiblePrize: 0,
            numbers: t13
        });

        // 3. Winner 12 Hits (Change last 2 to wrong)
        const t12 = [...winningResult];
        t12[13] = 'A'; // Wrong
        t12[12] = 'A'; // Wrong
        tickets.push({
            id: 'ticket-12-hits', userId: 'u3', amount: 10, status: 'PENDING', possiblePrize: 0,
            numbers: t12
        });

        // 4. Losers (1497 tickets) - Just mock one representation to check logic, 
        // but for revenue calc we need total amount.
        // The service sums ticket.amount. So we can just have these 3 tickets but with amount adjusted?
        // No, let's create a "Ghost Ticket" representing the others for revenue calc?
        // The service iterates ALL tickets found.
        // Let's create dummy tickets or just mock the findMany return to include a "bulk" ticket? 
        // No, `reduce` uses `ticket.amount`.
        // Let's just use these 3 tickets but set their prices higher to simulate R$ 15,000 total?
        // Wait, logic says "shared by winners".
        // If I manipulate amount, it works for pool, but simpler to just add a 4th ticket
        // with amount = 14970.
        tickets.push({
            id: 'ticket-bulk-losers', userId: 'u4', amount: 14970, status: 'PENDING', possiblePrize: 0,
            numbers: Array(14).fill('A') // All wrong
        });

        // Total Revenue = 10 + 10 + 10 + 14970 = 15,000.

        // MOCK RETURNS
        mockPrisma.draw.findUnique.mockResolvedValue(mockDraw);
        mockPrisma.ticket.findMany.mockResolvedValue(tickets);

        // ACT
        // access private or public method? `processDrawResults` is private.
        // But `update` calls it. Or we can cast service to any.
        await (service as any).processDrawResults(mockPrisma, mockDraw);

        // ASSERT
        // Prize Pool = 10,500.
        // 14 Hits gets 80% = 8,400.
        // 13 Hits gets 15% = 1,575.
        // 12 Hits gets 5% = 525.

        // Check 14 Hits Winner
        expect(mockPrisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'ticket-14-hits' },
            data: expect.objectContaining({
                status: 'WON',
                possiblePrize: 8400
            })
        }));

        // Check 13 Hits Winner
        expect(mockPrisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'ticket-13-hits' },
            data: expect.objectContaining({
                status: 'WON',
                possiblePrize: 1575
            })
        }));

        // Check 12 Hits Winner
        expect(mockPrisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'ticket-12-hits' },
            data: expect.objectContaining({
                status: 'WON',
                possiblePrize: 525
            })
        }));

        // Check Loser
        expect(mockPrisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'ticket-bulk-losers' },
            data: expect.objectContaining({ status: 'LOST', possiblePrize: 0 }) // Should be 0 or unchanged? Logic says 0 in updateBatch
        }));
    });
});
