import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
    description: string;
    amount: number;
    type: TransactionType;
    category?: string;
    cobradorId?: string;
    pin?: string;
}
