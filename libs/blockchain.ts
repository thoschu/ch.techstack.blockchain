import { createHash, Hash, randomUUID } from 'node:crypto';
import { inc, last } from 'ramda';

import { Block } from '@/block/block.class';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';

export class Blockchain {
    private static readonly SHA512: Hash = createHash('sha512')
    private readonly _chain: BlockI[] = [];
    private _pendingTransactions: TransactionI[] = [];

    constructor() {
        console.log(randomUUID());
    }

    public get chain(): BlockI[] {
        return this._chain;
    }

    public get pendingTransactions(): TransactionI[] {
        return this._pendingTransactions;
    }

    private set pendingTransactions(value: TransactionI[]) {
        this._pendingTransactions = value;
    }

    public createNewTransaction(payload: unknown, sender: string, recipient: string, data: unknown): TransactionI {
        return null;
    }

    public getLastBlock(): BlockI {
        return last<BlockI>(this.chain);
    }

    public createHash(block: BlockI): string {
        const blockString: string = JSON.stringify(block);

        return Blockchain.SHA512.update(blockString).digest('hex'); //"base64" | "base64url" | "hex" | "binary"
    }

    public createNewBlockInChain(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const newBlock: BlockI = this.createNewBlock(nonce, previousBlockHash, hash);

        this.pendingTransactions = [];
        this.chain.push(newBlock);

        return newBlock;
    }

    private createNewBlock(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const { length: chainLength }: { length: number }  = this.chain;
        const index: number = inc(chainLength);
        const transactions: TransactionI[] = this._pendingTransactions;

        return new Block(index, transactions, nonce, previousBlockHash, hash);
    }
}
