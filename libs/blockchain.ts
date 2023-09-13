import { createHash } from 'node:crypto';
import { equals, inc, last, not } from 'ramda';

import { Block } from '@/block/block.class';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { Transaction, TransactionData } from '@/transaction/transaction.class';

import { head } from 'ramda';

export type CurrentBlockData = Record<'transactions', ReadonlyArray<TransactionI>> & Record<'index', number>;

export interface BlockchainIsValidI {
    valid(): boolean;
}

export class Blockchain {
    #_difficulty: number;
    #_genesisBlockData = {
        nonce: -1,
        previousBlockHash: '',
        hash: '0'
    }
    private readonly _chain: BlockI[] = [];
    private _pendingTransactions: TransactionI[] = [];
    private readonly _currentNodeUrl: URL;
    private readonly _networkNodes: URL[] = [];

    public constructor(currentNodeUrl: URL, difficulty: number = 4) {
        this.initChainWithGenesisBlock();
        this._currentNodeUrl = currentNodeUrl;
        this.#_difficulty = difficulty;
    }

    public blockchainIsValid(chain: BlockI[]): any {
        const genesisBlock: BlockI = head<BlockI>(chain);
        let validChain: boolean = true;

        for (let i: number = 1; i < chain.length; i++) {
            const currentBlock: BlockI = chain[i];
            const currentBlockHash: string = currentBlock.hash
            const currentBlockNonce: number = currentBlock.nonce;
            const { transactions }: { transactions: readonly TransactionI[]} = currentBlock;
            const index: number = currentBlock.index;
            const previousBlock: BlockI = chain[i - 1];
            const previousBlockHash: string = previousBlock.previousBlockHash;
            const blockHash: string = this.calculateHash(previousBlockHash, { transactions, index }, currentBlockNonce);

            console.log(blockHash);
            if(blockHash.substring(0, 4) !== '0000') validChain = false;
            if(currentBlockHash !== previousBlockHash) validChain = false;
        }


        const correctNonce: boolean = equals<number>(genesisBlock.nonce, this.#_genesisBlockData.nonce);
        const correctPreviousBlockHash: boolean = equals<string>(genesisBlock.previousBlockHash, this.#_genesisBlockData.previousBlockHash);
        const correctHash: boolean = equals<string>(genesisBlock.hash, this.#_genesisBlockData.hash);
        const correctTransactions: boolean = equals<number>(genesisBlock.transactions.length, 0);

        if(!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) validChain = false;

        return validChain;
    }w

    public get chain(): BlockI[] {
        return this._chain;
    }

    public get pendingTransactions(): TransactionI[] {
        return this._pendingTransactions;
    }
    public set pendingTransactions(value: TransactionI[]) {
        this._pendingTransactions = value;
    }

    public get networkNodes(): URL[] {
        return this._networkNodes;
    }

    public get currentNodeUrl(): URL {
        return this._currentNodeUrl;
    }

    public proofOfWork(previousBlockHash: string, currentBlockData: CurrentBlockData): number {
        const targetPrefix: string = '0'.repeat(this.#_difficulty);
        let nonce: number = 0;
        let hash: string = this.calculateHash(previousBlockHash, currentBlockData, nonce);

        while (not(equals(hash.substring(0, 4), targetPrefix))) {
            nonce++;
            hash = this.calculateHash(previousBlockHash, currentBlockData, nonce);
        }

        return nonce;
    }

    public calculateHash(previousBlockHash: string, blockData: CurrentBlockData, nonce: number): string {
        const blockDataAsString: string = `${previousBlockHash}${nonce.toString()}${JSON.stringify(blockData)}`;

        return createHash('sha512').update(blockDataAsString).digest('hex');
    }

    public createNewTransaction(value: unknown, sender: string, recipient: string, data?: unknown): TransactionI {
        const newTransactionData: TransactionData = { data, recipient, sender, value };

        return new Transaction(newTransactionData);
    }

    public addNewTransactionToPendingTransaction(newTransaction: TransactionI): number {
        const lastBlock: BlockI = this.getLastBlock();
        const { index: lastBlockIndex }: { index: number } = lastBlock;

        this.pendingTransactions.push(newTransaction);

        return inc(lastBlockIndex);
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
        this.createNewBlockInChain(this.#_genesisBlockData.nonce, this.#_genesisBlockData.previousBlockHash, this.#_genesisBlockData.hash);
    }

    private createNewBlock(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const { length: chainLength }: { length: number }  = this.chain;
        const index: number = inc(chainLength);
        const transactions: TransactionI[] = this.pendingTransactions;

        return new Block(index, transactions, nonce, previousBlockHash, hash);
    }
}
