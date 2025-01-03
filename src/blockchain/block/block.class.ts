import { DateTime } from 'luxon';
import { v6 as UUIDv6 } from 'uuid';
import { replace } from 'ramda';

import { Block as IBlock } from '@blockchain/block/block.interface';
import { Transaction } from '@blockchain/transaction/transaction.class';
import { Validator } from '@blockchain/validator/validator.interface';

export default class Block<T> implements IBlock<T> {
  #id: string = replace(/-/g, '', UUIDv6());
  #validator: Validator | string = 'system';
  public readonly timestamp: number;
  public readonly index: number;
  public readonly nonce: number;
  public readonly previousHash: string;
  public readonly hash: string;
  public readonly transactions: Transaction<T>[];
  public coinBase: any | null = null;
  public data: string = '';

  constructor(index: number, nonce: number, previousHash: string, hash: string, transactions: Transaction<T>[]) {
      this.timestamp = DateTime.now().toMillis();
      this.index = index;
      this.nonce = nonce;
      this.previousHash = previousHash;
      this.hash = hash;
      this.transactions = transactions;
  }

  public get id(): string {
    return this.#id;
  }

  public get validator(): Validator | string {
      return this.#validator;
  }
}
