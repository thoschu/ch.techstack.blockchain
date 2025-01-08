import { BinaryLike, createHash, generateKeyPairSync } from 'crypto';
import axios, { AxiosResponse } from 'axios';
import {
  add, and, clone, dec, equals,
  gt, head, inc,
  isNotEmpty, last, length,
  multiply, not, nth, prop,
  subtract, toString
} from 'ramda';
import { v5 as UUIDv5, v7 as UUIDv7 } from 'uuid';

import Block from '@blockchain/block/block.class';
import { Validator } from '@blockchain/validator/validator.interface';
import { Transaction } from '@blockchain/transaction/transaction.class';
import { SmartContract } from '@blockchain/smartcontract/smartcontract.interface';

export type BlockData<T> = {
  transactions: ReadonlyArray<Transaction<T>>;
  index: number;
};

export type AddTransactionReturn<T> = {
  transaction: Transaction<T>;
  position: number;
  index: number;
};

export class Blockchain<T> {
  public static nodeAddress: string;
  public readonly networkNode: string;
  private readonly _networkNodes: Set<string> = new Set<string>();
  private readonly _timestamp: number = Date.now();
  private readonly _id: string = UUIDv7();
  private readonly _chain: Block<T>[] = [];
  private readonly _transactions: Transaction<T>[] = [];
  private readonly _validators: Validator[] = [];
  private readonly _contracts: Map<string, SmartContract<T, unknown>> = new Map<string, SmartContract<T, unknown>>();
  private _difficulty: number;

  constructor(nodeUrl: URL, difficulty: number = 4) {
    Blockchain.nodeAddress = UUIDv5(nodeUrl.href, UUIDv5.URL).split('-').join('');

    this.networkNode = nodeUrl.href;

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

  public get networkNodes(): Set<string> {
    return this._networkNodes;
  }

  public get chain(): Block<T>[] {
    return this._chain;
  }
  public set chain(chain: Block<T>[]) {
    this._chain.length = 0;
    this._chain.push(...chain);
  }

  public get transactions(): Transaction<T>[] {
    return this._transactions;
  }
  public set transactions(transactions: Transaction<T>[]) {
    this._transactions.length = 0;
    this.transactions.push(...transactions);
  }

  public get id(): string {
    return this._id;
  }

  public get timestamp(): number {
    return this._timestamp;
  }

  public get validators(): Validator[] {
    return this._validators;
  }

  public get contracts(): any {
    return this._contracts;
  }

  public registerSmartContract(name: string, contract: SmartContract<T, unknown>): void {
    this._contracts.set(name, contract);
    console.log(`Smart Contract "${name}" registered.`);
  }

  // public executeSmartContract(name: string, data: any): any {
  //   const contract = this._smartContracts.get(name);
  //   if (!contract) throw new Error(`Smart Contract "${name}" not found.`);
  //   return contract.execute(data, this.chain);
  // }

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

    for (const item of this.networkNodes) {
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

  public addNode(node: URL): Set<string> {
    const { href }: Record<'href', string> = node;

    return this._networkNodes.add(href);
  }

  public createTransaction(sender: string, receiver: string, amount: T): Transaction<T> {
    return new Transaction<T>(sender, receiver, amount);
  }

  public addNewTransaction(transaction: Transaction<T>): AddTransactionReturn<T> {
    const position: number = this._transactions.push(transaction);
    const previousBlock: Block<T> = this.getPreviousBlock();
    const previousBlockIndex: number = prop<'index', Block<T>>('index', previousBlock);
    const index: number = inc(previousBlockIndex);

    return {
      transaction,
      position,
      index
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

  public createBlock(nonce: number, previousHash: string, hash: string): Block<T> {
    const blockchainLength: number = length<Block<T>[]>(this._chain);
    const index: number = inc(blockchainLength);
    const transactions: Transaction<T>[] = clone<Transaction<T>>(this._transactions);
    const block: Block<T> = new Block<T>(index, nonce, previousHash, hash, transactions);

    this._transactions.length = 0;
    this._chain.push(block);

    return block;
  }

  public getPreviousBlock(): Block<T> {
    return last<Block<T>>(this._chain)!;
  }

  public proofOfWork(previousHash: string, blockData: BlockData<T>): number {
    const zero: string = '0';
    const target: string = zero.repeat(this.difficulty);
    let nonce: number = 0;
    let hash: string = this.hashBlock(previousHash, blockData, nonce);

    while (not(equals<string>(hash.substring(0, this.difficulty), target))) {
      nonce++;
      hash = this.hashBlock(previousHash, blockData, nonce);
    }

    return nonce;
  }

  public hashBlock(previousHash: string, blockData: BlockData<T>, nonce: number): string {
    const encodedBlock: string = previousHash.concat(toString<BlockData<T>>(blockData)).concat(toString<number>(nonce));

    return this.getSHA256(encodedBlock);
  }

  public getSHA256(data: BinaryLike): string {
    return createHash('sha256').update(data).digest('hex');
  }

  public chainIsValid(chain: ReadonlyArray<Block<T>>): boolean {
    const genesisBlock: Block<T> = head<Block<T>>(chain)!;
    const { index }: Record<'index', number> = genesisBlock;
    const { nonce }: Record<'nonce', number>  = genesisBlock;
    const { previousHash }: Record<'previousHash', string>  = genesisBlock;
    const { transactions }: Record<'transactions', Transaction<T>[]>  = genesisBlock;
    const indexIsOne: boolean = equals<number>(index, 1);
    const nonceIsNegativeOne: boolean = equals<number>(nonce, -1);
    const previousHashIsZero: boolean = equals<string>(previousHash, '0'.repeat(this.difficulty));
    const transactionsLengthIsZero: boolean = equals<number>(length<Transaction<T>[]>(transactions), 0);
    const indexIsOneAndNonceIsNegativeOne: boolean = and<boolean, boolean>(indexIsOne, nonceIsNegativeOne);
    const previousHashIsZeroAndTransactionsLengthIsZero: boolean = and<boolean, boolean>(previousHashIsZero, transactionsLengthIsZero);
    const genesisBlockIsValid: boolean = and<boolean, boolean>(indexIsOneAndNonceIsNegativeOne, previousHashIsZeroAndTransactionsLengthIsZero);
    let chainIsValid: boolean = true;

    for(let i = 1; i < chain.length; i++) {
      const decI: number = dec(i);
      const previousBlock: Block<T> = chain[decI];
      const currentBlock: Block<T> = chain[i];
      const previousBlockHash: string = previousBlock.hash;
      const currentBlockPreviousHash: string = currentBlock.previousHash;
      const { transactions }: Record<'transactions', Transaction<T>[]> = currentBlock;
      const { index }: Record<'index', number> = currentBlock
      const currentBlockNonce: number = currentBlock.nonce;
      const blockData: BlockData<T>= { transactions, index };
      const blockHash: string = this.hashBlock(previousBlockHash, blockData, currentBlockNonce);
      const target: string = '0'.repeat(this.difficulty);
      const isNotTarget: boolean = not(equals<string>(blockHash.substring(0, this.difficulty), target));
      const isHashesNotValid: boolean = not(equals<string>(currentBlockPreviousHash, previousBlockHash));

      if(and<boolean, boolean>(isNotTarget, isHashesNotValid)) chainIsValid = false;
    }

    return and<boolean, boolean>(chainIsValid, genesisBlockIsValid);
  };

  public isChainValid(chain: ReadonlyArray<Block<T>>): boolean {
    let previousBlock: Block<T> = head<Block<T>>(chain)!;
    let blockIndex: number = 1;

    while (blockIndex < length<Block<T>[]>([...chain])) {
      const block: Block<T> = nth(blockIndex, chain)!;
      const previousHash: string = prop<'previousHash', Block<T>>('previousHash', block);
      // const hash: string = this.hashBlock(previousHash, blockData, nonce);
      //
      // if (not(equals<string>(previousHash, this.hashBlock(previousBlock)))) {
      //   return false;
      // }

      const previousNonce: number = prop<'nonce', Block<T>>('nonce', previousBlock);
      const nonce: number = prop<'nonce', Block<T>>('nonce', block);
      const operation: number = subtract(nonce ** 2, previousNonce ** 2);
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
    const zero: string = '0';
    const previousHash: string = zero.repeat(this.difficulty);
    const index: number = 1;
    const transactions: Transaction<T>[] = this.transactions;
    const blockData: BlockData<T> = { transactions, index };
    const nonce: number = this.proofOfWork(previousHash, blockData);
    const hash: string = this.hashBlock(previousHash, blockData, nonce);

    return this.createBlock(-1, previousHash, hash);
  }
}
