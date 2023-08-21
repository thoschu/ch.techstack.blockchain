import { randomUUID } from 'node:crypto';

import { Blockchain } from '@/blockchain';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';

function isTimestamp(value: number): boolean {
    const date: Date = new Date(value);

    return !isNaN(date.getTime());
}

describe('Blockchain', (): void => {
    let blockchain: Blockchain;
    let nonce: number = 375;
    let previousBlockHash: string = '6fa3';
    let hash: string = 'bc48';
    let block: BlockI;
    let block2: BlockI;

    beforeEach( (): void => {
        blockchain = new Blockchain();
        block = blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);
    });

    it('should create a blockchain object:', (): void => {
        expect(blockchain).toBeDefined();
    });

    it('createNewBlockInChain:', (): void => {
        const isTimestamp: boolean = !isNaN(new Date(block.timestamp).getTime());

        expect(block).toBeDefined();
        expect(block.index).toEqual(1);
        expect(isTimestamp).toBe(true);
        expect(block.transactions.length).toEqual(0);
        expect(block.nonce).toEqual(nonce);
        expect(block.previousBlockHash).toEqual(previousBlockHash);
        expect(block.hash).toEqual(hash);

        expect(blockchain.chain.length).toEqual(1);
        expect(blockchain.chain).toEqual([block]);
        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(blockchain.pendingTransactions).toEqual([]);

        nonce = 13;
        previousBlockHash = hash;
        hash = '69fe';
        block2 = blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);

        expect(blockchain.chain.length).toEqual(2);
        expect(blockchain.chain).toEqual([block, block2]);
        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(blockchain.pendingTransactions).toEqual([]);
    });

    it('createNewPendingTransaction:', (): void => {
        const transactionBlockIndex: number = blockchain.createNewPendingTransaction('xxx', 'sender', 'recipient');

        expect(transactionBlockIndex).toEqual(2);
        expect(blockchain.pendingTransactions.length).toEqual(1);

        nonce = 77;
        previousBlockHash = hash;
        hash = 'tz8u';
        block2 = blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);

        expect(blockchain.chain.length).toEqual(2);
        expect(blockchain.chain.includes(block2)).toBeTruthy();
        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(block2).toEqual(blockchain.chain[blockchain.chain.length - 1]);

        blockchain.createNewPendingTransaction('xxxx', 'sender2', 'recipient2');
        blockchain.createNewPendingTransaction('xxxxx', 'sender3', 'recipient3');
        blockchain.createNewPendingTransaction('xxxxxx', 'sender4', 'recipient4');

        expect(blockchain.pendingTransactions.length).toEqual(3);
        expect(blockchain.chain.length).toEqual(2);

        nonce = 7;
        previousBlockHash = hash;
        hash = 't8uw';
        blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);

        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(blockchain.chain.length).toEqual(3);
        expect(blockchain.chain[blockchain.chain.length - 1].transactions.length).toEqual(3);
    });

    it('hashBlock:', (): void => {
        const previousBlockHash: string = '3ta6';
        const currentBlockData: TransactionI[] = [
            {
                data: 'hamburg',
                id: '97ee48bd-3f76-4d10-8354-fb0625c2823b',
                nonce: 10,
                recipient: 'x',
                sender: 'y',
                timestamp: 1692648645656,
                value: 0
            }, {
                data: 'berlin',
                id: '750c1ed3-3318-4867-b2fe-cf601d69f640',
                nonce: 100,
                recipient: 'xx',
                sender: 'yy',
                timestamp: 1692648645657,
                value: 1
            }, {
                data: 'bielefeld',
                id: 'bc1b07b3-004a-4ab6-a4a1-d53d5d4d6359',
                nonce: 1000,
                recipient: 'xxx',
                sender: 'yyy',
                timestamp: 1692648645659,
                value: 2
            }
        ];
        const nonce: number = 99999;
        const hash: string = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);

        expect(hash).toEqual('9f47c6ecac90a93506e636b578da06db91faf7f8ab03621ecf280569889e18906db27dae052bb3a6f2e8d9e82a4bd3185244736e034bfab62ae809ac4dbccc20');
    });
});
