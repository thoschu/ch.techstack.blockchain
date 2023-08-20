import { UUID } from 'node:crypto';

export interface TransactionI {
    readonly id: UUID;
    readonly value: unknown;
    readonly sender: string;
    readonly recipient: string;
    readonly data: unknown;
    readonly timestamp: number;
    readonly nonce: number;
}
