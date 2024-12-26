import { Block as IBlock } from '@blockchain/block/block.interface';
import { Transaction } from '@blockchain/transaction/transaction.class';
import { Validator } from '@blockchain/validator/validator.interface';

export default class Block<T> implements IBlock<T> {
    public readonly timestamp: number;
    public index: number = 0;
    public proof: number = 0;
    public previousHash: string = '';
    public hash: string = '';
    public transactions: Transaction<T>[] = [];
    public coinBase: any | null = null;
    public data: string = '';
    public validator: Validator | string | null = null; // 'system'

    constructor(index: number, proof: number, previousHash: string, transactions: Transaction<T>[]) {
        this.timestamp = Date.now();
        this.index = index;
        this.proof = proof;
        this.previousHash = previousHash;
        this.transactions = transactions;
    }
}
