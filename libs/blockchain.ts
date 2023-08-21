import { createHash, Hash } from 'node:crypto';
import { inc, last } from 'ramda';

import { Block } from '@/block/block.class';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { Transaction, TransactionData } from '@/transaction/transaction.class';

export class Blockchain {
    private readonly _chain: BlockI[] = [];
    private _pendingTransactions: TransactionI[] = [];

    constructor() {
        this.initChainWithGenesisBlock();
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

    public proofOfWork(previousBlockHash: string, currentBlockData: TransactionI[]): any {
        let nonce: number = 0;
        let hash: string = this.hashBlock(previousBlockHash, currentBlockData, nonce);

        while (hash.substring(0, 4) !== '0000') {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }

        return nonce;
    }

    public hashBlock(previousBlockHash: string, blockData: TransactionI[], nonce: number): string {
        const blockDataAsString: string = `${previousBlockHash}${nonce.toString()}${JSON.stringify(blockData)}`;

        return createHash('sha512').update(blockDataAsString).digest('hex');
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

    private initChainWithGenesisBlock(): void {
        this.createNewBlockInChain(-1, '', '0');
        console.log(this.chain);
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
        const transactions: TransactionI[] = this.pendingTransactions;

        return new Block(index, transactions, nonce, previousBlockHash, hash);
    }
}
