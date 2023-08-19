import { TransactionI } from '@/transaction/transaction.interface';
import { BlockI } from '@/block/block.interface';

export class BlockClass implements BlockI {
    private _index: number;
    private _timestamp: number;
    private _transactions: TransactionI[];
    private _nonce: number;
    private _previousBlockHash: string;
    private _hash: string;

    constructor(index: number, transactions: TransactionI[], nonce: number, previousBlockHash: string, hash: string) {
        this.index = index;
        this.timestamp = Date.now();
        this.transactions = transactions;
        this.nonce = nonce;
        this.previousBlockHash = previousBlockHash;
        this.hash = hash;
    }

    public get index(): number {
        return this._index;
    }
    private set index(value: number) {
        this._index = value;
    }

    public get timestamp(): number {
        return this._timestamp;
    }
    protected set timestamp(value: number) {
        this._timestamp = value;
    }

    public get transactions(): TransactionI[] {
        return this._transactions;
    }
    protected set transactions(value: TransactionI[]) {
        this._transactions = value;
    }

    public get nonce(): number {
        return this._nonce;
    }
    protected set nonce(value: number) {
        this._nonce = value;
    }

    public get previousBlockHash(): string {
        return this._previousBlockHash;
    }
    protected set previousBlockHash(value: string) {
        this._previousBlockHash = value;
    }

    public get hash(): string {
        return this._hash;
    }
    protected set hash(value: string) {
        this._hash = value;
    }
}