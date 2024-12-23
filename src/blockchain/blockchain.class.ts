import { BinaryLike, createHash } from 'crypto';
import {
  add,
  clone,
  equals,
  head,
  inc,
  last,
  length,
  multiply,
  not,
  nth,
  prop,
  startsWith,
  subtract,
  toString
} from 'ramda';
import { v7 as UUIDv7 } from 'uuid';

import Block from '@blockchain/block/block.class';
import { Validator } from '@blockchain/validator/validator.interface';
import { Transaction } from "@blockchain/transaction/transaction.class";

export class Blockchain<T> {
  private readonly _timestamp: number = Date.now();
  private readonly _id: string = UUIDv7();
  private readonly _chain: Block<T>[] = [];
  private readonly _transactions: Transaction<T>[] = [];
  private readonly _validators: Validator[] = [];
  private _difficulty: number;

  constructor(difficulty: number = 4) {
    this._difficulty = difficulty;

    this.createGenesisBlock();

    console.log('[[ ' + this.id + ' ][ ' + this.timestamp + ' ]]');
    console.log('-----------------------------');
    console.log(this.getPreviousBlock());
    console.log('-----------------------------');
  }

  public get difficulty(): number {
    return this._difficulty;
  }
  public set difficulty(difficulty: number) {
    this._difficulty = difficulty;
  }

  public get chain(): Block<T>[] {
    return this._chain;
  }

  public get transactions(): Transaction<T>[] {
    return this._transactions;
  }

  public get id(): string {
    return this._id;
  }

  public get timestamp(): number {
    return this._timestamp;
  }

  public get validators(): any {
    return this._validators;
  }

  public addTransaction(sender: string, receiver: string, amount: T) {
    const transaction: Transaction<T> = new Transaction<T>(sender, receiver, amount);
    const previousBlock: Block<T> = this.getPreviousBlock();
    const previousBlockIndex: number = prop<'index', Block<T>>('index', previousBlock);

    this._transactions.push(transaction);

    return {
      transaction,
      index: inc(previousBlockIndex)
    };
  }

  public addValidator(address: string, stake: number): void {
    this._validators.push({ address, stake });
  }

  private selectValidator(): string {
    const totalStake = this.validators.reduce((sum: number, validator: Validator) => {
      return add(sum, prop<'stake', Validator>('stake',validator));
    }, 0);
    const random: number = multiply(Math.random(), totalStake);

    let cumulativeStake: number = 0;
    for (const validator of this.validators) {
      cumulativeStake += validator.stake;
      if (random < cumulativeStake) {
        return validator.address;
      }
    }

    throw new Error("Validator selection failed");
  }

  public createBlock(nonce: number, previousHash: string): Block<T> {
    const blockchainLength: number = length<Block<T>[]>(this._chain);
    const index: number = inc(blockchainLength);
    const transactions: Transaction<T>[] = clone<Transaction<T>>(this._transactions);
    const block: Block<T> = new Block<T>(index, nonce, previousHash, transactions);

    this._transactions.length = 0;
    this._chain.push(block);

    return block;
  }

  public getPreviousBlock(): Block<T> {
    return last<Block<T>>(this._chain)!;
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

  public hash(block: Block<T>): string {
    const encodedBlock: string = toString<Block<T>>(block);

    return this.getSHA256(encodedBlock);
  }

  public getSHA256(data: BinaryLike): string {
    return createHash('sha256').update(data).digest('hex');
  }

  public isChainValid(chain: Array<Block<T>>): boolean {
    let previousBlock: Block<T> = head<Block<T>>(chain)!;
    let blockIndex: number = 1;

    while (blockIndex < length<Block<T>[]>(chain)) {
      const block: Block<T> = nth(blockIndex, chain)!;
      const previousHash: string = prop<'previousHash', Block<T>>('previousHash', block);

      if (not(equals<string>(previousHash, this.hash(previousBlock)))) {
        return false;
      }

      const previousProof: number = prop<'proof', Block<T>>('proof', previousBlock);
      const proof: number = prop<'proof', Block<T>>('proof', block);
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

  private createGenesisBlock(): Block<T> {
    return this.createBlock(-1, '0000');
  }
}
