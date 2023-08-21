import { Injectable } from '@nestjs/common';
import { Blockchain } from '@/blockchain';
import { BlockI } from '@/block/block.interface';

@Injectable()
export class AppService {
  private readonly blockchain: Blockchain;

  constructor() {
    this.blockchain = new Blockchain();
  }
  public getBlockchain(): BlockI[] {
    return this.blockchain.chain
  }

  public getHello(): string {
    return `Tom S.`;
  }
}
