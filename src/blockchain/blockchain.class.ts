import { BinaryLike, createHash, generateKeyPairSync } from 'crypto';
import axios, { AxiosResponse } from 'axios';
import {
  add, and,
  clone,
  equals, gt, gte,
  head,
  inc, isNotEmpty,
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
import { v5 as UUIDv5, v7 as UUIDv7 } from 'uuid';

import Block from '@blockchain/block/block.class';
import { Validator } from '@blockchain/validator/validator.interface';
import { Transaction } from "@blockchain/transaction/transaction.class";

export class Blockchain<T> {
  public static nodeAddress: string;
  private readonly _nodes: Set<string> = new Set<string>();
  private readonly _timestamp: number = Date.now();
  private readonly _id: string = UUIDv7();
  private readonly _chain: Block<T>[] = [];
  private readonly _transactions: Transaction<T>[] = [];
  private readonly _validators: Validator[] = [];
  private _difficulty: number;

  constructor(nodeUrl: URL, difficulty: number = 4) {
    Blockchain.nodeAddress = UUIDv5(nodeUrl.href, UUIDv5.URL);

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

  public get nodes(): Set<string> {
    return this._nodes;
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

  public generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    return {
      publicKey: publicKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
      privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
    };
  }

  public async replaceChain() {
    let longestChain: Block<T>[] = [];
    let maxLength: number = length<Block<T>[]>(this._chain);

    for (const item of this.nodes) {
      const apiResponse: AxiosResponse = await axios.get( `${item}api/v3/get-chain`);
      const { data, status }: Record<'data', Record<'length', number> & Record<'chain', Block<T>[]>> & Record<'status', number> = apiResponse;
      const { length: currentBlockChainLength, chain: currentBlockChain }: Record<'length', number> & Record<'chain', Block<T>[]> = data;
      const isCurrentBlockChainLengthGreaterThenMaxLength: boolean = gt<number>(currentBlockChainLength, maxLength);
      const isCurrentBlockChainValid: boolean = this.isChainValid(currentBlockChain);

      if(/*(status === 200) &&*/ and<boolean, boolean>(isCurrentBlockChainLengthGreaterThenMaxLength, isCurrentBlockChainValid)) {
        maxLength = currentBlockChainLength;
        longestChain = currentBlockChain;
      }
    }

    if(isNotEmpty<Block<T>>(longestChain)) {
      this._chain.length = 0;
      this._chain.push(...longestChain);

      return true;
    }

    return false;
  }

  public addNode(node: URL): void {
    this._nodes.add(node.href);
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

    // mining reward:
    if(gte<number>(length<Block<T>[]>(this._chain), 1)) {
      transactions.push(new Transaction<T>(Blockchain.nodeAddress, 'Tom S.', 1 as T));
    }

    const block: Block<T> = new Block<T>(index, nonce, previousHash, transactions);

    this._transactions.length = 0;
    this._chain.push(block);

    return block;
  }

  public getPreviousBlock(): Block<T> {
    return last<Block<T>>(this._chain)!;
  }

  public proofOfWork(previousProof: number): number {
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

  public isChainValid(chain: ReadonlyArray<Block<T>>): boolean {
    let previousBlock: Block<T> = head<Block<T>>(chain)!;
    let blockIndex: number = 1;

    while (blockIndex < length<Block<T>[]>([...chain])) {
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
