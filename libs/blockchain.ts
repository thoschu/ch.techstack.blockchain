import { createHash, Hash } from 'node:crypto';
import { inc, last } from 'ramda';

import { Block } from '@/block/block.class';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { Transaction, TransactionData } from '@/transaction/transaction.class';

export class Blockchain {
    private static readonly SHA512: Hash = createHash('sha512');
    private readonly _chain: BlockI[] = [];
    private _pendingTransactions: TransactionI[] = [];

    constructor() {}

    public get chain(): BlockI[] {
        return this._chain;
    }

    public get pendingTransactions(): TransactionI[] {
        return this._pendingTransactions;
    }

    private set pendingTransactions(value: TransactionI[]) {
        this._pendingTransactions = value;
    }

    public hashBlock(previousBlockHash: string, blockData: TransactionI[], nonce: number): string {
        const blockDataAsString: string = `${previousBlockHash}${nonce.toString()}${JSON.stringify(blockData)}`;

        return Blockchain.SHA512.update(blockDataAsString).digest('hex');
    }

    public createNewPendingTransaction(value: unknown, sender: string, recipient: string, data?: unknown): number {
        const newTransactionData: TransactionData = { data, recipient, sender, value };
        const newTransaction: TransactionI = new Transaction(newTransactionData);

        return this.putTransactionsInBlock(newTransaction);
    }

    public createNewBlockInChain(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const newBlock: BlockI = this.createNewBlock(nonce, previousBlockHash, hash);

        this.pendingTransactions = [];
        this.chain.push(newBlock);

        return newBlock;
    }

    private putTransactionsInBlock(newTransaction: TransactionI): number {
        const lastBlock: BlockI = this.getLastBlock();
        const { index: lastBlockIndex }: { index: number } = lastBlock;

        this.pendingTransactions.push(newTransaction);

        return inc(lastBlockIndex);
    }

    private getLastBlock(): BlockI {
        return last<BlockI>(this.chain);
    }

    private createNewBlock(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const { length: chainLength }: { length: number }  = this.chain;
        const index: number = inc(chainLength);
        const transactions: TransactionI[] = this._pendingTransactions;

        return new Block(index, transactions, nonce, previousBlockHash, hash);
    }
}
