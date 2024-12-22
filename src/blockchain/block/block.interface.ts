export interface Block {
    readonly timestamp: number;
    readonly index: number;
    readonly proof: number;
    readonly previousHash: string;
    readonly hash: string;
    readonly transactions: any[];
    readonly coinBase: any | null;
    readonly data: string | null;
}
