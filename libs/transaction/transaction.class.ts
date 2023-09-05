import { randomUUID, UUID } from 'node:crypto';
import { TransactionI } from '@/transaction/transaction.interface';

export type TransactionData = {
    recipient: string;
    sender: string;
    value: unknown;
    data?: unknown;
    nonce?: number;
}

export class Transaction implements TransactionI {
    private _data: unknown;
    private _id: UUID;
    private _nonce: number;
    private _recipient: string;
    private _sender: string;
    private _timestamp: number;
    private _value: unknown;

    constructor(transactionData: TransactionData) {
        const { data, nonce, recipient, sender, value }: TransactionData = transactionData;

        this.data = data;
        this.id = randomUUID();
        this.nonce = nonce;
        this.recipient = recipient
        this.sender = sender;
        this.timestamp = Date.now();
        this.value = value;
    }

    public get data(): unknown {
        return this._data;
    }
    protected set data(data: unknown) {
        this._data = data;
    }

    public get id(): UUID {
        return this._id;
    }
    protected set id(id: UUID) {
        this._id = id;
    }

    public get nonce(): number {
        return this._nonce;
    }
    protected set nonce(nonce: number) {
        this._nonce = nonce;
    }

    public get recipient(): string {
        return this._recipient;
    }
    protected set recipient(recipient: string) {
        this._recipient = recipient;
    }

    public get sender(): string {
        return this._sender;
    }
    protected set sender(sender: string) {
        this._sender = sender;
    }

    public get timestamp(): number {
        return this._timestamp;
    }
    protected set timestamp(timestamp: number) {
        this._timestamp = timestamp;
    }

    public get value(): unknown {
        return this._value;
    }
    protected set value(value: unknown) {
        this._value = value;
    }
}

export default Transaction;
