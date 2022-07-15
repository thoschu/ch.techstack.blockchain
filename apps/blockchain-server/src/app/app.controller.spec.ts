import { Test, TestingModule } from '@nestjs/testing';

import { BlockchainService } from "@ch.techstack.blockchain/blockchain";

import { x2 } from "sha256";

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('app:blockchain-server AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, BlockchainService],
    }).compile();
  });

  describe('blockchain', () => {
    it('getHash', () => {
      const genesisHash: string = x2('genesis');
      const appController: AppController = app.get<AppController>(AppController);
      // const hash: string = appController.getHash();
      //
      // expect(hash).toEqual(genesisHash);
    });
  });
});
