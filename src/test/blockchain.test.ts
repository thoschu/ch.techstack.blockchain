import { createHash } from 'crypto';
import { isUUID, UUIDVersion } from 'validator';

import { Blockchain } from '@blockchain/blockchain.class';
import Block from '@blockchain/block/block.class';
import {Transaction} from '@blockchain/transaction/transaction.class';
import {toString} from "ramda";

const protocol: string = 'http:';
const address: string  = '0.0.0.0';
const baseUrl: string = `${protocol}//${address}:3000`;
const url: URL = new URL('/', baseUrl);

let blockchain: Blockchain<number>;

beforeEach((): void => {
  blockchain = new Blockchain<number>(url);
});

describe('📍 Blockchain', (): void => {
  test('⭕  init and create Genesis-Block', (): void => {
    expect(blockchain.chain.length).toBe(1);
    expect(blockchain.transactions.length).toBe(0);
    expect(blockchain.validators.length).toBe(0);
    expect(blockchain.contracts.size).toBe(0);
    expect(blockchain.nodes.size).toBe(0);
    expect(blockchain.difficulty).toBe(4);
  });

  test('❗ createBlock(nonce: number, previousHash: string, hash: string): Block<T>', (): void => {
    const previousHash: string = createHash('sha256').update('previousHash').digest('hex');
    const hash: string = createHash('sha256').update('hash').digest('hex');
    const block: Block<number> = blockchain.createBlock(0, previousHash, hash);

    expect(blockchain.chain.length).toBe(2);
    expect(block.index).toBe(2);
    expect(block.nonce).toBe(0);
    expect(block.previousHash).toBe(previousHash);
    expect(block.hash).toBe(hash);

    blockchain.createBlock(1, createHash('sha256').update('a').digest('hex'), '0000');
    blockchain.createBlock(2, createHash('sha256').update('b').digest('hex'), '0000');
    blockchain.createBlock(3, createHash('sha256').update('c').digest('hex'), '0000');
    blockchain.createBlock(4, createHash('sha256').update('d').digest('hex'), '0000');
    blockchain.createBlock(5, createHash('sha256').update('e').digest('hex'), '0000');

    expect(blockchain.chain.length).toBe(7);
  });

  test('❗ addTransaction(sender: string, receiver: string, amount: T): { transaction: Transaction<T>; position: number; index: number }', (): void => {
    const from: string = 'Tom S.';
    const to: string = 'John D.';
    const value: number = 10;
    let tx: { transaction: Transaction<number>; position: number; index: number; } = blockchain.addTransaction(from, to, value);
    const transaction: Transaction<number> = tx.transaction;
    const uuidVersion: UUIDVersion = 7;

    expect(transaction).toBeInstanceOf(Transaction<number>);
    expect(isUUID(transaction.id, uuidVersion)).toBe(true);
    expect(transaction.sender).toBe(from);
    expect(transaction.receiver).toBe(to);
    expect(transaction.amount).toBe(value);
    expect(transaction.contract).toBe(undefined);
    expect(tx.position).toBe(1);
    expect(tx.index).toBe(2);
    expect(blockchain.transactions.length).toBe(1);

    tx = blockchain.addTransaction(from, to, value * value);

    expect(blockchain.transactions.length).toBe(2);

    let block: Block<number> = blockchain.createBlock(0, '0000', createHash('sha256').update('a').digest('hex'));

    expect(blockchain.transactions.length).toBe(0);
    expect(block.transactions.length).toBe(3);
    expect(block.transactions[1]).toStrictEqual(tx.transaction);

    blockchain.addTransaction(from, to, value + 1);
    blockchain.addTransaction(from, to, value + 2);
    blockchain.addTransaction(from, to, value + 3);
    tx = blockchain.addTransaction(from, to, value + 4);

    expect(blockchain.transactions.length).toBe(4);
    expect(blockchain.transactions[3]).toStrictEqual(tx.transaction);
    expect(blockchain.chain.length).toBe(2);

    block = blockchain.createBlock(0, '0000', createHash('sha256').update('a').digest('hex'));

    expect(blockchain.transactions.length).toBe(0);
    expect(blockchain.chain.length).toBe(3);
    expect(block.transactions.length).toBe(5);
    expect(block.transactions[block.transactions.length - 2]).toStrictEqual(tx.transaction);
  });

  test('❗ hashBlock(previousHash: string, blockData: ReadonlyArray<Transaction<T>>, nonce: number): string', (): void => {
    const { previousHash }: Record<'previousHash', string> = blockchain.getPreviousBlock();
    const firstTransaction: Transaction<number> = new Transaction<number>('Tom S.', 'John D.', 10);
    const secondTransaction: Transaction<number> = new Transaction<number>('Jane D.', 'Tom S.', 100);
    const blockData: Transaction<number>[] = [firstTransaction, secondTransaction];
    const nonce: number = 0;
    const hash: string = blockchain.hashBlock(previousHash, blockData, nonce);
    const data: string = previousHash.concat(toString<Transaction<number>[]>(blockData)).concat(toString<number>(nonce));
    const localHash: string = createHash('sha256').update(data).digest('hex');

    expect(hash).toBe(localHash);
  });
});
