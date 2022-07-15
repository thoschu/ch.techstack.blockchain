import { Test, TestingModule } from '@nestjs/testing';

import { BlockchainService } from './blockchain.service';
import {Blockchain} from "./blockchain.class";

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

  it('provides blockchain lib', () => {
    const testBlockchain: Blockchain = service.blockchain;
    
    expect(testBlockchain).toBeInstanceOf(Blockchain)
  });
});
