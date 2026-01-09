import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
    description: string;
    amount: number;
    type: TransactionType;
    cobradorId?: string;
    pin?: string;
}
