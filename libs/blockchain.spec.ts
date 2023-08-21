import { randomUUID } from 'node:crypto';

import { Blockchain } from '@/blockchain';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';



describe('Blockchain', (): void => {
    let blockchain: Blockchain;
    let nonce: number = 375;
    let previousBlockHash: string = '6fa3';
    let hash: string = 'bc48';
    let block: BlockI;
    let block2: BlockI;
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

    beforeEach( (): void => {
        blockchain = new Blockchain();
        block = blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);
    });

    it('should create a blockchain object and the Genesis-Block:', (): void => {
        expect(blockchain).toBeDefined();
        expect(blockchain.chain.length).toEqual(2);
        expect(blockchain.chain[0].index).toEqual(1);
        expect(blockchain.chain[0].transactions.length).toEqual(0);
        expect(blockchain.chain[0].nonce).toEqual(-1);
        expect(blockchain.chain[0].previousBlockHash).toEqual('');
        expect(blockchain.chain[0].hash).toEqual('0');
    });

    it('createNewBlockInChain:', (): void => {
        const isTimestamp: boolean = !isNaN(new Date(block.timestamp).getTime());

        expect(block).toBeDefined();
        expect(block.index).toEqual(2);
        expect(isTimestamp).toBe(true);
        expect(block.transactions.length).toEqual(0);
        expect(block.nonce).toEqual(nonce);
        expect(block.previousBlockHash).toEqual(previousBlockHash);
        expect(block.hash).toEqual(hash);

        expect(blockchain.chain.length).toEqual(2);
        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(blockchain.pendingTransactions).toEqual([]);

        nonce = 13;
        previousBlockHash = hash;
        hash = '69fe';
        block2 = blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);

        expect(blockchain.chain.length).toEqual(3);
        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(blockchain.pendingTransactions).toEqual([]);
    });

    it('createNewPendingTransaction:', (): void => {
        const transactionBlockIndex: number = blockchain.createNewPendingTransaction('xxx', 'sender', 'recipient');

        expect(transactionBlockIndex).toEqual(3);
        expect(blockchain.pendingTransactions.length).toEqual(1);

        nonce = 77;
        previousBlockHash = hash;
        hash = 'tz8u';
        block2 = blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);

        expect(blockchain.chain.length).toEqual(3);
        expect(blockchain.chain.includes(block2)).toBeTruthy();
        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(block2).toEqual(blockchain.chain[blockchain.chain.length - 1]);

        blockchain.createNewPendingTransaction('xxxx', 'sender2', 'recipient2');
        blockchain.createNewPendingTransaction('xxxxx', 'sender3', 'recipient3');
        blockchain.createNewPendingTransaction('xxxxxx', 'sender4', 'recipient4');

        expect(blockchain.pendingTransactions.length).toEqual(3);
        expect(blockchain.chain.length).toEqual(3);

        nonce = 7;
        previousBlockHash = hash;
        hash = 't8uw';
        blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);

        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(blockchain.chain.length).toEqual(4);
        expect(blockchain.chain[blockchain.chain.length - 1].transactions.length).toEqual(3);
    });

    it('hashBlock:', (): void => {
        let previousBlockHash: string = '3ta6';
        let nonce: number = 999;
        let hash: string = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);

        expect(hash).toEqual('7b9b5f776fb7219fe08bbc71bc85bc81532eae72d46c390931860e866acef4c54ede8969a4b6932fe5307c1c313b5109c5eef2ffea05db1c3a414618b9e93690');

        previousBlockHash = hash;
        currentBlockData.push({
            data: 'erlangen',
            id: '5c1b07b3-004a-4ab6-a4a1-d53d5d4d635c',
            nonce: 1000,
            recipient: 'xxxx',
            sender: 'yyyy',
            timestamp: 1692648645660,
            value: 3
        });
        nonce = 9999;
        hash = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);

        expect(hash).not.toEqual('7b9b5f776fb7219fe08bbc71bc85bc81532eae72d46c390931860e866acef4c54ede8969a4b6932fe5307c1c313b5109c5eef2ffea05db1c3a414618b9e93690');
        expect(hash).toEqual('719f0dc2d49924ac2386f30f48087359c5c6a9e7bb57d13744a315d88991c8c96191cd5e1738147d6cda27b2e2596b28f778aab3edea609910de1d65954dd628');
    });

    it('proofOfWork:', (): void => {
        const previousBlockHash: string = 'uft7';
        const nonce: number = blockchain.proofOfWork(previousBlockHash, currentBlockData);

        expect(nonce).toEqual(6255);

        const hash: string = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);

        expect(hash.startsWith('0000')).toBeTruthy();
    });
});
