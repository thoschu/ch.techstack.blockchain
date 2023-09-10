export interface ContractI {
    readonly name: string;
    readonly timestamp: number;
    readonly nonce: number;
    readonly do: unknown;
}
