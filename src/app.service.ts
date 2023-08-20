import { Injectable } from '@nestjs/common';
import { Blockchain } from '@/blockchain';
import { BlockI } from '@/block/block.interface';

@Injectable()
export class AppService {
  private readonly blockchain: Blockchain;

  constructor() {
    this.blockchain = new Blockchain();
  }
  private getHash(block: BlockI): string {
    return this.blockchain.createHash(block);
  }

  public getHello(): string {
    return `Tom S.`;
  }
}
