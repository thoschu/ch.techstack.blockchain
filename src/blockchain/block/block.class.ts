import { Block as IBlock } from "./block.interface";

export default class Block implements IBlock{
    public readonly timestamp: number;
    public index: number = 0;
    public proof: number = 0;
    public previousHash: string = '';
    public hash: string = '';
    public transactions: any[] = [];
    public coinBase: any | null = null;
    public data: string = '';

    constructor(index: number, proof: number, previousHash: string) {
        this.timestamp = Date.now();
        this.index = index;
        this.proof = proof;
        this.previousHash = previousHash;
    }

}
