import { Test, TestingModule } from '@nestjs/testing';
import { Boom } from "@hapi/boom";

import { BlockchainModule, BlockchainService } from '@ch.techstack.blockchain/blockchain';
import { IBlock, IBlockchain, ITransaction } from "@ch.techstack.blockchain/blockchain-interface";

import { Headers } from 'express';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreateTransactionDto } from './transaction.entity';
import {
  MysqlNestjsConnectorModule,
  MysqlNestjsConnectorService
} from '@ch.techstack.blockchain/mysql-nestjs-connector';
import { JwtService } from '@nestjs/jwt';

describe('app:blockchain-server AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [BlockchainModule, MysqlNestjsConnectorModule],
      controllers: [AppController],
      providers: [AppService, MysqlNestjsConnectorService, JwtService, BlockchainService],
    }).compile();
  });

  describe('public api', () => {
    let appController: AppController;

    beforeEach(() => {
      appController = app.get<AppController>(AppController);
    });

    it('notFound', () => {
      const url = '/api/v1/';
      const method = 'GET';
      const request: Request = { url, method } as Request;
      const appControllerNotFoundResult: Boom<string> = appController.notFound(request);
      const boom404: Boom<string> = {
        "data": url,
        "isBoom": true,
        "isServer": false,
        "output": {
          "statusCode": 404,
          "payload": {
            "statusCode": 404,
            "error": "Not Found",
            "message": method
          },
          "headers": {}
        }
      } as Boom<string>;

      expect(JSON.stringify(appControllerNotFoundResult)).toEqual(JSON.stringify(boom404));
    });

    it('getBlockchain', () => {
      const blockchain: IBlockchain<IBlock, ITransaction> = appController.getBlockchain();
      const keys: Array<string> = Object.keys(blockchain);
      const hasBlockchainKeys: boolean = keys.includes('_chain') && keys.includes('_pendingTransactions');

      expect(hasBlockchainKeys).toEqual(true);
    });

    it('getBlockchain - is genesis-block', () => {
      const blockchain: IBlockchain<IBlock, ITransaction> = appController.getBlockchain();
      const lastBlock: IBlock = blockchain.getLastBlock();
      const genesisIndex: number = lastBlock.index;

      expect(genesisIndex).toEqual(1);
    });

    it('mineNewBlock', () => {
      const request: Request = { } as Request;
      const blockchain: { note: string, block: IBlock } = appController.mineNewBlock(request);
      const minedBlockKeys: Array<string> = Object.keys(blockchain);
      const blockKeys = ['note', 'block'];

      expect(minedBlockKeys).toEqual(blockKeys);
    });

    it('createNewTransactionAndReturnsBlockIndex', () => {
      const body: CreateTransactionDto = {
        "payload": "test-payload",
        "sender": "John Doe",
        "recipient": "Jane Roe"
      };
      const transaction: { note: string, index: number, body: ITransaction } = appController.createNewTransactionAndReturnsBlockIndex(body);
      const transactionIndexKeys: Array<string> = Object.keys(transaction);
      const transactionKeys = ['note', 'index', 'body'];

      expect(transactionIndexKeys).toEqual(transactionKeys);
    });
  });
});
