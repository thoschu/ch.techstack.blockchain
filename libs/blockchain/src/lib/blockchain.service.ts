import { Injectable } from '@nestjs/common';

import { Blockchain } from './blockchain.class';

@Injectable()
export class BlockchainService {
  private readonly _blockchain: Blockchain;

  constructor() {
    this._blockchain = new Blockchain();
  }

  public get blockchain(): Blockchain {
    return this._blockchain;
  }
}
