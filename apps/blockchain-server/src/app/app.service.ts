import { Injectable } from '@nestjs/common';
import {IBlock, IBlockchain, ITransaction} from '@ch.techstack.blockchain/blockchain-interface';
import { BlockchainService } from "@ch.techstack.blockchain/blockchain";

@Injectable()
export class AppService {
  private readonly _blockchain: IBlockchain<IBlock, ITransaction>;

  constructor(private readonly blockchainService: BlockchainService) {
    this._blockchain = blockchainService.blockchain;
  }

  public get blockchain(): IBlockchain<IBlock, ITransaction> {
    return this._blockchain;
  }
}
