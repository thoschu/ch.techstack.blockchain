import { x2 } from 'sha256';
import { length } from "ramda";
import { v5 as uuidV5 } from 'uuid';

import { Blockchain } from './blockchain.class';

import { IBlock, ITransaction } from "@ch.techstack.blockchain/blockchain-interface";

describe('Blockchain', () => {
  const MY_NAMESPACE = '6fc2e23a-95d3-4004-be9b-28c044403004';
  let testBlockchain: Blockchain;

  beforeEach(() => {
    testBlockchain = new Blockchain();
  });

  describe('Test Blockchain constructor', () => {
    it('genesis block has valid hash', () => {
      const testBlock: IBlock = testBlockchain.getLastBlock();
      const hashFromGenesisBlock: string = testBlock.hash;
      const genesisHash = '0000';

      expect(hashFromGenesisBlock).toBe(genesisHash);
    });

    it('genesis block has valid previousBlockHash', () => {
      const testBlock: IBlock = testBlockchain.getLastBlock();
      const previousBlockHashFromGenesisBlock: string = testBlock.previousBlockHash;

      expect(previousBlockHashFromGenesisBlock).toBe('0');
    });

    it('genesis block has valid nonce', () => {
      const testBlock: IBlock = testBlockchain.getLastBlock();
      const nonceFromGenesisBlock: number = testBlock.nonce;

      expect(nonceFromGenesisBlock).toBe(-1);
    });
  });

  describe('Test Blockchain returns valid Block',() => {
    const nonce = 1377;
    const previousBlockHash: string = null;
    const hash: string = x2('hash');

    it('index supposed to be', () => {
      const testBlock: IBlock = testBlockchain.createNewBlock(nonce, previousBlockHash, hash);
      const index: number = testBlock.index;

      expect(index).toBe(2);
    });

    it('timestamp supposed to be', () => {
      const testBlock: IBlock = testBlockchain.createNewBlock(nonce, previousBlockHash, hash);
      const timestamp: number = testBlock.timestamp;
      const date: Date = new Date(timestamp);

      expect(date).toBeInstanceOf(Date);
    });

    it('transactions: supposed to be empty', () => {
      const testBlock: IBlock = testBlockchain.createNewBlock(nonce, previousBlockHash, hash);
      const transactions: Array<ITransaction> = testBlock.transactions;

      expect(transactions).toEqual([]);
    });

    it('nonce supposed to be', () => {
      const testBlock: IBlock = testBlockchain.createNewBlock(nonce, previousBlockHash, hash);
      const testBlockNonce: number = testBlock.nonce

      expect(testBlockNonce).toBe(nonce);
    });

    it('previousBlockHash supposed to be', () => {
      const testBlock: IBlock = testBlockchain.createNewBlock(nonce, previousBlockHash, hash);
      const testBlockPreviousBlockHash: string = testBlock.previousBlockHash;

      expect(testBlockPreviousBlockHash).toBe(previousBlockHash);
    });

    it('hash supposed to be', () => {
      const testBlock: IBlock = testBlockchain.createNewBlock(nonce, previousBlockHash, hash);
      const testBlockHash: string = testBlock.hash;

      expect(testBlockHash).toBe(hash);
    });
  });

  describe('Test Blockchain chain-variable has valid length', () => {
    const nonce1 = 13;
    const previousBlockHash1: string = null;
    const hash1: string = x2('hash1');

    const nonce2 = 7;
    const previousBlockHash2: string = hash1;
    const hash2: string = x2('hash2');

    const nonce3 = 77;
    const previousBlockHash3: string = hash2;
    const hash3: string = x2('hash3');

    it('testBlockchain chain has to be length of 1', () => {
      testBlockchain.createNewBlock(nonce1, previousBlockHash1, hash1);

      const chainLength: number = testBlockchain.chain.length;

      expect(chainLength).toBe(2);
    });

    it('testBlockchain chain has to be length of 2', () => {
      testBlockchain.createNewBlock(nonce1, previousBlockHash1, hash1);
      testBlockchain.createNewBlock(nonce2, previousBlockHash2, hash2);

      const chainLength: number = testBlockchain.chain.length;

      expect(chainLength).toBe(3);
    });

    it('testBlockchain chain has to be length of 3', () => {
      testBlockchain.createNewBlock(nonce1, previousBlockHash1, hash1);
      testBlockchain.createNewBlock(nonce2, previousBlockHash2, hash2);
      testBlockchain.createNewBlock(nonce3, previousBlockHash3, hash3);

      const chainLength: number = testBlockchain.chain.length;

      expect(chainLength).toBe(4);
    });

    it('testBlockchain chain has the right last element', () => {
      testBlockchain.createNewBlock(nonce1, previousBlockHash1, hash1);
      testBlockchain.createNewBlock(nonce2, previousBlockHash2, hash2);

      const lastBlock: IBlock = testBlockchain.createNewBlock(nonce3, previousBlockHash3, hash3);
      const testBlockchainLastBlock: IBlock = testBlockchain.getLastBlock();

      expect(testBlockchainLastBlock).toBe(lastBlock);
    });
  });

  describe('Test Blockchain pendingTransactions-variable has valid length', () => {
    const nonce1 = 1977;
    const previousBlockHash1: string = null;
    const hash1: string = x2('hash1');

    const nonce2 = 1307;
    const previousBlockHash2: string = hash1;
    const hash2: string = x2('hash2');

    const nonce3 = 77;
    const previousBlockHash3: string = hash2;
    const hash3: string = x2('hash3');

    const payload = 'Tom S.';
    const sender: string = uuidV5('John Doe', MY_NAMESPACE);
    const recipient: string = uuidV5('Jane Roe', MY_NAMESPACE);

    it('transactions 1.', () => {
      testBlockchain.createNewBlock(nonce1, previousBlockHash1, hash1);

      testBlockchain.createNewTransaction(payload, sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(2), sender, recipient);

      const newBlockIndex: number = testBlockchain.createNewTransaction(payload.repeat(3), sender, recipient);

      testBlockchain.createNewBlock(nonce2, previousBlockHash2, hash2);

      const lastBlock: IBlock = testBlockchain.getLastBlock();
      const lastBlockIndex: number = lastBlock.index;

      expect(newBlockIndex).toBe(lastBlockIndex);
    });

    it('transactions 2.', () => {
      testBlockchain.createNewBlock(nonce1, previousBlockHash1, hash1);

      testBlockchain.createNewTransaction(payload, sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(2), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(3), sender, recipient);

      testBlockchain.createNewBlock(nonce2, previousBlockHash2, hash2);

      const lastBlock: IBlock = testBlockchain.getLastBlock();
      const lastBlockTransactions: Array<ITransaction> = lastBlock.transactions;
      const lastBlockTransactionsLength: number = length<Array<ITransaction>>(lastBlockTransactions);

      expect(lastBlockTransactionsLength).toBe(3);
    });

    it('transactions 3.', () => {
      testBlockchain.createNewBlock(nonce1, previousBlockHash1, hash1);

      testBlockchain.createNewTransaction(payload, sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(2), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(3), sender, recipient);

      testBlockchain.createNewBlock(nonce2, previousBlockHash2, hash2);

      let testBlockchainPendingTransactions: Array<ITransaction> = testBlockchain.pendingTransactions;

      expect(testBlockchainPendingTransactions).toEqual([]);

      testBlockchain.createNewTransaction(payload.repeat(4), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(5), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(6), sender, recipient);

      testBlockchainPendingTransactions = testBlockchain.pendingTransactions;

      const testBlockchainPendingTransactionsLength: number = length<Array<ITransaction>>(testBlockchainPendingTransactions);

      expect(testBlockchainPendingTransactionsLength).toBe(3);
    });

    it('transactions 4.', () => {
      testBlockchain.createNewBlock(nonce1, previousBlockHash1, hash1);

      testBlockchain.createNewTransaction(payload, sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(2), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(3), sender, recipient);

      testBlockchain.createNewBlock(nonce2, previousBlockHash2, hash2);

      testBlockchain.createNewTransaction(payload.repeat(4), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(5), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(6), sender, recipient);

      const testBlockchainPendingTransactions: Array<ITransaction> = testBlockchain.pendingTransactions;
      const testBlockchainPendingTransactionsLength: number = length<Array<ITransaction>>(testBlockchainPendingTransactions);

      expect(testBlockchainPendingTransactionsLength).toBe(3);
    });

    it('transactions 4.', () => {
      testBlockchain.createNewBlock(nonce1, previousBlockHash1, hash1);

      testBlockchain.createNewTransaction(payload, sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(2), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(3), sender, recipient);

      testBlockchain.createNewBlock(nonce2, previousBlockHash2, hash2);

      testBlockchain.createNewTransaction(payload.repeat(4), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(5), sender, recipient);
      testBlockchain.createNewTransaction(payload.repeat(6), sender, recipient);

      const newBlockIndex: number =  testBlockchain.createNewTransaction(payload.repeat(7), sender, recipient);

      const newBlock: IBlock = testBlockchain.createNewBlock(nonce3, previousBlockHash3, hash3);

      const testBlockchainLastBlock: IBlock = testBlockchain.getLastBlock();
      const testBlockchainLastBlockTransactions: Array<ITransaction> = testBlockchainLastBlock.transactions;
      const testBlockchainLastBlockTransactionsLength: number = length<Array<ITransaction>>(testBlockchainLastBlockTransactions);
      const testBlockchainLastBlockIndex: number = testBlockchainLastBlock.index;

      expect(newBlock).toBe(testBlockchainLastBlock);
      expect(testBlockchainLastBlockTransactionsLength).toBe(4);
      expect(newBlockIndex).toBe(testBlockchainLastBlockIndex);
    });
  });

  describe('hashBlock',() => {
    const previousBlockHash: string = x2('previousBlockHash');
    const nonce = 7707;
    const currentBlockData: Array<ITransaction> = [
      {
        payload: 'foo',
        sender: uuidV5('John Doe', MY_NAMESPACE),
        recipient: uuidV5('Jane Roe', MY_NAMESPACE)
      }, {
        payload: 'bar',
        sender: uuidV5('John Doe', MY_NAMESPACE),
        recipient: uuidV5('Jane Roe', MY_NAMESPACE)
      }, {
        payload: 'baz',
        sender: uuidV5('John Doe', MY_NAMESPACE),
        recipient: uuidV5('Jane Roe', MY_NAMESPACE)
      }
    ];

    it('generates valid hash',() => {
      const regexExpHash = /^[a-f0-9]{64}$/gi;
      const hash: string = testBlockchain.hashBlock(previousBlockHash, currentBlockData, nonce);
      const isValidHash: boolean = regexExpHash.test(hash);

      expect(isValidHash).toBe(true);
    });
  });

  describe('proofOfWork',() => {
    const previousBlockHash: string = x2('previousBlockHash');
    const currentBlockData: Array<ITransaction> = [
      {
        payload: 'Lorem ipsum, dolor sit amet, consetetur sadipscing elitr.',
        sender: uuidV5('John Doe', MY_NAMESPACE),
        recipient: uuidV5('Jane Roe', MY_NAMESPACE)
      }, {
        payload: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed ede.',
        sender: uuidV5('John Doe', MY_NAMESPACE),
        recipient: uuidV5('Jane Roe', MY_NAMESPACE)
      }, {
        payload: ' At vero eos et accusam et justo duo.',
        sender: uuidV5('John Doe', MY_NAMESPACE),
        recipient: uuidV5('Jane Roe', MY_NAMESPACE)
      }
    ];

    it('generates valid nonce',() => {
      const nonce0000: number = testBlockchain.proofOfWork(previousBlockHash, currentBlockData);

      expect(nonce0000).toBe(196638);
    });

    it('generates valid hash like 0000',() => {
      const hashMatch = '0000';
      const nonce0000: number = testBlockchain.proofOfWork(previousBlockHash, currentBlockData);
      const block0000 = testBlockchain.hashBlock(previousBlockHash, currentBlockData, nonce0000);
      const startHashWith4Zero: boolean = block0000.startsWith(hashMatch);

      expect(startHashWith4Zero).toBe(true);
    });
  });
});
