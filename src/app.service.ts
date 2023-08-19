import { Injectable } from '@nestjs/common';
import { Blockchain } from '@/blockchain';

@Injectable()
export class AppService {
  private readonly blockchain: Blockchain;

  constructor() {
    this.blockchain = new Blockchain('Thomas Schulte');
  }
  public getHash(): string {
    return this.blockchain.getHash();
  }

  public getHello(): string {
    return this.blockchain.greeter();
  }
}
