import { Transaction } from '@blockchain/transaction/transaction.class';
import { Validator } from '@blockchain/validator/validator.interface';

export interface Block<T> {
    readonly timestamp: number;
    readonly index: number;
    readonly proof: number;
    readonly previousHash: string;
    readonly hash: string;
    readonly transactions: Transaction<T>[];
    readonly coinBase: any | null;
    readonly data: string | unknown | null;
    readonly validator: Validator | string | null;
}
