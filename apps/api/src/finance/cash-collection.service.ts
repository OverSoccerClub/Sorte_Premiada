import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashCollectionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Finalizes a cash collection (Sangria) between a Collector and a Cambista.
     * Requires the Collector's Security PIN for verification.
     */
    async collectCash(data: {
        cambistaId: string;
        cobradorId: string;
        amount: number;
        securityPin: string;
        description?: string;
    }) {
        const { cambistaId, cobradorId, amount, securityPin } = data;

        // 1. Verify cobrador and PIN
        const cobrador = await this.prisma.user.findUnique({
            where: { id: cobradorId }
        });

        if (!cobrador || cobrador.role !== 'COBRADOR') {
            throw new BadRequestException("Cobrador não encontrado ou inválido.");
        }

        if (cobrador.securityPin !== securityPin) {
            throw new BadRequestException("PIN de segurança incorreto.");
        }

        // 2. Verify cambista
        const cambista = await this.prisma.user.findUnique({
            where: { id: cambistaId }
        });

        if (!cambista || cambista.role !== 'CAMBISTA') {
            throw new BadRequestException("Cambista não encontrado.");
        }

        // 3. Create a DEBIT transaction for the Cambista
        // This transaction is linked to the cobrador in our schema
        return this.prisma.transaction.create({
            data: {
                userId: cambistaId,
                cobradorId: cobradorId,
                amount: amount,
                type: 'DEBIT',
                description: data.description || `SANGRA - Coleta efetuada por ${cobrador.name || cobrador.username}`,
            }
        });
    }

    /**
     * Gets a summary of pending balance for a specific cambista.
     * (Vendas - Comissao - Premios Pagos - Sangrias Anteriores)
     */
    async getCambistaBalanceSummary(cambistaId: string) {
        const transactions = await this.prisma.transaction.findMany({
            where: { userId: cambistaId }
        });

        const totalCredits = transactions
            .filter(t => t.type === 'CREDIT')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalDebits = transactions
            .filter(t => t.type === 'DEBIT')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // We also need to subtract current commissions from Sales if they aren't created as transactions yet
        // In our current implementation, Ticket netValue is stored, but maybe we just sum transactions?
        // To be safe, let's assume balance = Credits - Debits.
        // If Sales are Credits and Comissao is implicitly removed, then Credits = NetSales + Prizes.

        return {
            balance: totalCredits - totalDebits,
            totalCredits,
            totalDebits
        };
    }
}
