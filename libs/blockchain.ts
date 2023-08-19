import { createHash, Hash } from 'node:crypto';
import { inc } from 'ramda';

import { BlockClass } from '@/block/block.class';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';


export class Blockchain {
    private readonly chain: BlockI[] = [];
    private readonly sha512: Hash;
    private newTransactions: TransactionI[] = [];

    constructor() {
        this.sha512 = createHash('sha512');
    }

    public getHash(block: BlockI): string {
        const blockString: string = JSON.stringify(block);

        return this.sha512.update(blockString).digest('hex'); //"base64" | "base64url" | "hex" | "binary"
    }

    public createNewBlockInChain(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const newBlock: BlockI = this.createNewBlock(nonce, previousBlockHash, hash);

        this.newTransactions = [];
        this.chain.push(newBlock);

        return newBlock;
    }

    private createNewBlock(nonce: number, previousBlockHash: string, hash: string): BlockI {
        const { length: chainLength }: { length: number }  = this.chain;
        const index: number = inc(chainLength);
        const transactions: TransactionI[] = this.newTransactions;

        return new BlockClass(index, transactions, nonce, previousBlockHash, hash);
    }
}
