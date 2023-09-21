import { createHash } from 'node:crypto';
import { dec, equals, head, inc, last, length, not, prop } from 'ramda';

import { Block } from '@/block/block.class';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { Transaction, TransactionData } from '@/transaction/transaction.class';

export type CurrentBlockData = Record<'transactions', ReadonlyArray<TransactionI>> & Record<'index', number>;

type GenesisBlockData = Record<'nonce', number> & Record<'previousBlockHash' | 'hash', string>;

export interface BlockchainIsValidI {
    valid(): boolean;
}

export class Blockchain {
    readonly #_difficulty: number;
    #_genesisBlockInitData: GenesisBlockData = {
        nonce: -1,
        previousBlockHash: '0000',
        hash: '0'
    } as const;
    private _chain: BlockI[] = [];
    private _pendingTransactions: TransactionI[] = [];
    private readonly _currentNodeUrl: URL;
    private readonly _networkNodes: URL[] = [];

    public constructor(currentNodeUrl: URL, difficulty: number = 4) {
        this.initChainWithGenesisBlock();
        this._currentNodeUrl = currentNodeUrl;
        this.#_difficulty = difficulty;
    }

    public blockchainIsValid(chain: ReadonlyArray<BlockI>): boolean {
        let validChain: boolean = true;

        for (let i: number = 1; i < chain.length; i++) {
            const decIndex: number = dec(i);
            const previousBlock: BlockI = chain[decIndex];
            const currentBlock: BlockI = chain[i];
            const currentBlockPreviousBlockHash: string = prop<string, '_previousBlockHash', BlockI>('_previousBlockHash', currentBlock);
            const previousBlockHash: string = prop<string, '_hash', BlockI>('_hash', previousBlock);

            if(currentBlockPreviousBlockHash !== previousBlockHash) validChain = false;

            const currentBlockNonce: number = prop<number, '_nonce', BlockI>('_nonce', currentBlock);
            const transactions: ReadonlyArray<TransactionI> = prop<ReadonlyArray<TransactionI>, '_transactions', BlockI>('_transactions', currentBlock);
            const index: number = prop<number, '_index', BlockI>('_index', currentBlock);
            const currentBlockData: CurrentBlockData = { index, transactions };
            const blockHash: string = this.calculateHash(previousBlockHash, currentBlockData, currentBlockNonce);

            if(blockHash.substring(0, 4) !== '0'.repeat(this.#_difficulty)) validChain = false;
        }

        const genesisBlockInitData: GenesisBlockData = this.#_genesisBlockInitData;
        const genesisBlock: BlockI = head<BlockI>(chain);
        const genesisBlockNonce: number = prop<number, '_nonce', BlockI>('_nonce', genesisBlock);
        const genesisBlockPreviousBlockHash: string = prop<string, '_previousBlockHash', BlockI>('_previousBlockHash', genesisBlock);
        const genesisBlockHash: string = prop<string, '_hash', BlockI>('_hash', genesisBlock);
        const genesisBlockTransactions: ReadonlyArray<TransactionI> = prop<ReadonlyArray<TransactionI>, '_transactions', BlockI>('_transactions', genesisBlock)
        const correctNonce: boolean = equals<number>(genesisBlockNonce, genesisBlockInitData.nonce);
        const correctPreviousBlockHash: boolean = equals<string>(genesisBlockPreviousBlockHash, genesisBlockInitData.previousBlockHash);
        const correctHash: boolean = equals<string>(genesisBlockHash, genesisBlockInitData.hash);
        const correctTransactionsLength: boolean = equals<number>(length(genesisBlockTransactions), 0);
        const correctNonceNegated: boolean = not(correctNonce);
        const correctPreviousBlockHashNegated: boolean = not(correctPreviousBlockHash);
        const correctHashNegated: boolean = not(correctHash);
        const correctTransactionsLengthNegated: boolean = not(correctTransactionsLength);

        if(correctNonceNegated || correctPreviousBlockHashNegated || correctHashNegated || correctTransactionsLengthNegated) validChain = false;

        return validChain;
    }

    public get chain(): BlockI[] {
        return this._chain;
    }
    public set chain(chain: BlockI[]) {
        this._chain = chain;
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
        const genesisBlockData: GenesisBlockData = this.#_genesisBlockInitData;

        this.createNewBlockInChain(genesisBlockData.nonce, genesisBlockData.previousBlockHash, genesisBlockData.hash);
    }

    private createNewBlock(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const { length: chainLength }: { length: number }  = this.chain;
        const index: number = inc(chainLength);
        const transactions: TransactionI[] = this.pendingTransactions;

        return new Block(index, transactions, nonce, previousBlockHash, hash);
    }
}
