import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac } from 'crypto';

@Injectable()
export class SecurityService {
    private readonly logger = new Logger(SecurityService.name);
    private readonly SECRET_KEY = process.env.SECURITY_HMAC_KEY || 'sorte-premiada-secret-2026';

    constructor(private prisma: PrismaService) { }

    /**
     * Generates a digital signature for a ticket to prevent tampering.
     */
    generateTicketSignature(ticketData: {
        id: string;
        numbers: number[];
        amount: string | number;
        userId: string;
        drawDate: Date | null;
    }): string {
        const payload = JSON.stringify({
            id: ticketData.id,
            numbers: ticketData.numbers.sort((a, b) => a - b),
            amount: Number(ticketData.amount).toFixed(2),
            userId: ticketData.userId,
            drawDate: ticketData.drawDate?.toISOString() || ''
        });

        return createHmac('sha256', this.SECRET_KEY)
            .update(payload)
            .digest('hex');
    }

    /**
     * Checks if a bet is "Late" (placed too close to or after the draw).
     */
    async checkLateBet(ticketId: string, drawDate: Date, createdAt: Date) {
        // threshold: 30 seconds before draw
        const thresholdMs = 30 * 1000;
        const timeDiff = drawDate.getTime() - createdAt.getTime();

        if (timeDiff < thresholdMs) {
            const severity = timeDiff < 0 ? 'CRITICAL' : 'HIGH';
            const message = timeDiff < 0
                ? `Aposta realizada APÓS o sorteio! (Atraso: ${Math.abs(timeDiff / 1000)}s)`
                : `Aposta realizada muito próxima ao sorteio (Janela: ${timeDiff / 1000}s)`;

            await this.logSecurityEvent({
                type: timeDiff < 0 ? 'LATE_BET' : 'SUSPICIOUS_TIMING',
                severity,
                message,
                metadata: { ticketId, drawDate, createdAt, timeDiff },
            });

            return { isSuspicious: true, severity, message };
        }

        return { isSuspicious: false };
    }

    /**
     * Persists a security anomaly in the database.
     */
    async logSecurityEvent(data: {
        type: string;
        severity: string;
        message: string;
        metadata?: any;
        areaId?: string;
        userId?: string;
    }) {
        this.logger.warn(`SECURITY EVENT [${data.severity}]: ${data.message}`);

        return this.prisma.securityLog.create({
            data: {
                type: data.type,
                severity: data.severity,
                message: data.message,
                metadata: data.metadata,
                areaId: data.areaId,
                userId: data.userId
            }
        });
    }

    async findAllLogs() {
        return this.prisma.securityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    async resolveLog(id: string, resolvedBy: string) {
        return this.prisma.securityLog.update({
            where: { id },
            data: {
                isResolved: true,
                resolvedBy
            }
        });
    }
}
