import { Test } from '@nestjs/testing';

import { Blockchain, BlockchainService } from "@ch.techstack.blockchain/blockchain";
import {IBlock, IBlockchain, ITransaction} from "@ch.techstack.blockchain/blockchain-interface";

import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService, BlockchainService]
    }).compile();

    service = app.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('provides blockchain instance', () => {
    const testBlockchain: IBlockchain<IBlock, ITransaction> = service.blockchain;

    expect(testBlockchain).toBeInstanceOf(Blockchain);
  });
});
