import { Test, TestingModule } from '@nestjs/testing';
import { Blockchain } from '@/blockchain';
import { TransactionData } from '@/transaction/transaction.class';

import { AppV1Controller } from './app.controller';
import { AppService, MineResponse } from './app.service';

describe('AppController', (): void => {
  let appController: AppV1Controller;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppV1Controller],
      providers: [AppService],
    }).compile();

    appController = app.get<AppV1Controller>(AppV1Controller);
  });

  describe('AppV1Controller', (): void => {
    it('/blockchain: should return the blockchain', (): void => {
      const blockchain: Blockchain = appController.blockchain();

      expect(blockchain).toBeDefined();
      expect(blockchain).toBeInstanceOf(Blockchain);
    });

    it('/mine: should mine a new block and should return it', (): void => {
      const mineResponse: MineResponse = appController.mine();

      expect(mineResponse).toBeDefined();
      expect(mineResponse.note).toEqual('New block mined successfully.');
    });

    it('/transaction: should create a new pending transaction in the blockchain and should return the index of the new block', (): void => {
      const mockTransactionData: TransactionData = {
        recipient: 'thomas',
        sender: 'tom',
        value: 13
      };

      const index: number = appController.transaction(mockTransactionData);
      const blockchain: Blockchain = appController.blockchain();
      const lastTransaction: TransactionData = blockchain.pendingTransactions[blockchain.pendingTransactions.length - 1];
      const { recipient, sender, value }: TransactionData = lastTransaction;

      expect(index).toBe(2);
      expect(blockchain.pendingTransactions.length).toBe(1);
      expect(recipient).toBe(mockTransactionData.recipient);
      expect(sender).toBe(mockTransactionData.sender);
      expect(value).toBe(mockTransactionData.value);
    });
  });
});
