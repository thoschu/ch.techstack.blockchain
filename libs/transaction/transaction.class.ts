import { UUID } from 'node:crypto';
import { TransactionI } from '@/transaction/transaction.interface';
import {BlockI} from "@/block/block.interface";

export class Transaction implements TransactionI {
    private _data: unknown;
    private _id: UUID;
    private _nonce: number;
    private _recipient: string;
    private _sender: string;
    private _timestamp: number;
    private _value: unknown;
    constructor() {}

    public get data(): unknown {
        return this._data;
    }
    public set data(data: unknown) {
        this._data = data;
    }

    public get id(): UUID {
        return this._id;
    }
    public set id(id: UUID) {
        this._id = id;
    }

    readonly nonce: number;
    readonly recipient: string;
    readonly sender: string;
    readonly timestamp: number;
    readonly value: unknown;
}
