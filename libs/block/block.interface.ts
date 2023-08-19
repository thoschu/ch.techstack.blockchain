import { TransactionI } from '@/transaction/transaction.interface';


export interface BlockI {
    index: number;
    timestamp: number;
    transactions: TransactionI[];
    nonce: number;
    previousBlockHash: string;
    hash: string;
}
