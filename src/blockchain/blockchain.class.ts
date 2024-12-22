import { BinaryLike, createHash } from 'crypto';
import { equals, head, inc, last, length, not, nth, prop, startsWith, subtract, toString } from 'ramda';
import { v7 as UUIDv7 } from 'uuid';

import Block from '@blockchain/block/block.class';

export class Blockchain {
  private readonly _timestamp: number = Date.now();
  private readonly _id: string = UUIDv7();
  private readonly _chain: Block[] = [];
  private readonly _transactions: any[] = [];
  private _difficulty: number;

  constructor(difficulty: number = 4) {
    this._difficulty = difficulty;

    this.createGenesisBlock();

    console.log('[[ ' + this.id + ' ][ ' + this.timestamp + ' ]]');
    console.log('-----------------------------');
    console.log(this.getPreviousBlock());
    console.log('-----------------------------');
  }

  private createGenesisBlock(): Block {
    return this.createBlock(-1, '0000');
  }

  public get difficulty(): number {
    return this._difficulty;
  }
  public set difficulty(difficulty: number) {
    this._difficulty = difficulty;
  }

  public get chain(): Block[] {
    return this._chain;
  }

  public get id(): string {
    return this._id;
  }

  public get timestamp(): number {
    return this._timestamp;
  }

  public createBlock(nonce: number, previousHash: string): Block {
    const blockchainLength: number = length<Block[]>(this._chain);
    const index: number = inc(blockchainLength);
    const block: Block = new Block(index, nonce, previousHash);

    this._chain.push(block);

    return block;
  }

  public getPreviousBlock(): Block | undefined {
    return last<Block>(this._chain);
  }

  public proofOfWork(previousProof: number,): number {
    const target: string = '0'.repeat(this.difficulty);
    let newProof: number = 0;
    let checkProof: boolean = true;

    while (checkProof) {
      const operation: number = subtract(newProof ** 2, previousProof ** 2);
      const toCryptBinaryLike: string = toString<number>(operation)
      const hashOperation: string = this.getSHA256(toCryptBinaryLike);
      const hashOperationSubstring: string = hashOperation.substring(0, 4);
      const substringStartsWithTarget: boolean = startsWith(target, hashOperationSubstring);

      checkProof = not(substringStartsWithTarget);

      if (checkProof) {
        newProof = ++newProof;
      } else {
        console.log(hashOperation);
      }
    }

    return newProof;
  }

  public hash(block: Block): string {
    const encodedBlock: string = toString<Block>(block);

    return this.getSHA256(encodedBlock);
  }

  public getSHA256(data: BinaryLike): string {
    return createHash('sha256').update(data).digest('hex');
  }

  public isChainValid(chain: Array<Block>): boolean {
    let previousBlock: Block = head<Block>(chain)!;
    let blockIndex: number = 1;

    while (blockIndex < length<Block[]>(chain)) {
      const block: Block = nth(blockIndex, chain)!;
      const previousHash: string = prop<'previousHash', Block>('previousHash', block);

      if (not(equals<string>(previousHash, this.hash(previousBlock)))) {
        return false;
      }

      const previousProof: number = prop<'proof', Block>('proof', previousBlock);
      const proof: number =  prop<'proof', Block>('proof', block);
      const operation: number = subtract(proof ** 2, previousProof ** 2);
      const hashOperation: string = this.getSHA256(toString<number>(operation));
      const target: string = '0'.repeat(this.difficulty);

      if (not(equals<string>(hashOperation.substring(0, 4), target))) {
        return false;
      }

      previousBlock = block;
      blockIndex += 1;
    }

    return true;
  }
}
