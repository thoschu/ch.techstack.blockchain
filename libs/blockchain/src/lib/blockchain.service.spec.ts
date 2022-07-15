import { Test, TestingModule } from '@nestjs/testing';

import {IBlock, IBlockchain, ITransaction} from "@ch.techstack.blockchain/blockchain-interface";

import { Blockchain } from "./blockchain.class";
import { BlockchainService } from './blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService]
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('provides blockchain instance', () => {
    const testBlockchain: IBlockchain<IBlock, ITransaction> = service.blockchain;

    expect(testBlockchain).toBeInstanceOf(Blockchain);
  });
});
