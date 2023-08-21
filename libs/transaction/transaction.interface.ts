import { UUID } from 'node:crypto';

export interface TransactionI {
    readonly data: unknown;
    readonly id: UUID;
    readonly nonce: number;
    readonly recipient: string;
    readonly sender: string;
    readonly timestamp: number;
    readonly value: unknown;
}
