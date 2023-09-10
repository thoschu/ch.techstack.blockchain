import { TransactionI } from '@/transaction/transaction.interface';

export interface BlockI {
    readonly index: number;
    readonly timestamp: number;
    readonly transactions: ReadonlyArray<TransactionI>;
    readonly nonce: number;
    readonly previousBlockHash: string;
    readonly hash: string;
}
