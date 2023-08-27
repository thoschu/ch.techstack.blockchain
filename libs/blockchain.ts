import { createHash } from 'node:crypto';
import { inc, last } from 'ramda';

import { Block } from '@/block/block.class';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { Transaction, TransactionData } from '@/transaction/transaction.class';

export type CurrentBlockData = Record<'transactions', TransactionI[]> & Record<'index', number>;

export class Blockchain {
    private readonly _chain: BlockI[] = [];
    private _pendingTransactions: TransactionI[] = [];
    private readonly _currentNodeUrl: URL;
    private readonly _networkNodes: URL[] = [];

    public constructor(currentNodeUrl: URL) {
        this.initChainWithGenesisBlock();
        this._currentNodeUrl = currentNodeUrl;
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

    public get networkNodes(): URL[] {
        return this._networkNodes;
    }

    public get currentNodeUrl(): URL {
        return this._currentNodeUrl;
    }

    public proofOfWork(previousBlockHash: string, currentBlockData: CurrentBlockData): any {
        let nonce: number = 0;
        let hash: string = this.calculateHash(previousBlockHash, currentBlockData, nonce);

        while (hash.substring(0, 4) !== '0000') {
            nonce++;
            hash = this.calculateHash(previousBlockHash, currentBlockData, nonce);
        }

        return nonce;
    }

    public calculateHash(previousBlockHash: string, blockData: CurrentBlockData, nonce: number): string {
        const blockDataAsString: string = `${previousBlockHash}${nonce.toString()}${JSON.stringify(blockData)}`;

        return createHash('sha512').update(blockDataAsString).digest('hex');
    }

    public createNewPendingTransaction(value: unknown, sender: string, recipient: string, data?: unknown): number {
        const newTransactionData: TransactionData = { data, recipient, sender, value };
        const newTransaction: TransactionI = new Transaction(newTransactionData);

        return this.putTransactionsInBlock(newTransaction);
    }

    public getLastBlock(): BlockI {
        return last<BlockI>(this.chain);
    }

    public createNewBlockInChain(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const newBlock: BlockI = this.createNewBlock(nonce, previousBlockHash, hash);

        this.pendingTransactions = [];
        this.chain.push(newBlock);

        return newBlock;
    }

    private initChainWithGenesisBlock(): void {
        this.createNewBlockInChain(-1, '', '0');
    }

    private putTransactionsInBlock(newTransaction: TransactionI): number {
        const lastBlock: BlockI = this.getLastBlock();
        const { index: lastBlockIndex }: { index: number } = lastBlock;

        this.pendingTransactions.push(newTransaction);

        return inc(lastBlockIndex);
    }

    private createNewBlock(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const { length: chainLength }: { length: number }  = this.chain;
        const index: number = inc(chainLength);
        const transactions: TransactionI[] = this.pendingTransactions;

        return new Block(index, transactions, nonce, previousBlockHash, hash);
    }
}

