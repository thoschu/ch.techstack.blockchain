import { Test, TestingModule } from '@nestjs/testing';

import {BlockchainModule, BlockchainService} from "@ch.techstack.blockchain/blockchain";

import { x2 } from "sha256";

import { AppController } from './app.controller';
import { AppService } from './app.service';



describe('app:blockchain-server AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [BlockchainModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('blockchain', () => {
    it('getHash', () => {
      const appController: AppController = app.get<AppController>(AppController);
      // const req: Request = Request();
      // const foo = appController.forbidden(req);
      // console.log(foo);
      // const hash: string = appController.getHash();
      //
      // expect(hash).toEqual(genesisHash);
    });
  });

  // describe('blockchain', () => {
  //   it('getHash', () => {
  //     const genesisHash: string = x2('genesis');
  //     const appController: AppController = app.get<AppController>(AppController);
  //     // const hash: string = appController.getHash();
  //     //
  //     // expect(hash).toEqual(genesisHash);
  //   });
  // });
});
