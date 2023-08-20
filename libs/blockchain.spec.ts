import { Blockchain } from '@/blockchain';
import { BlockI } from '@/block/block.interface';

function isTimestamp(value: number): boolean {
    const date: Date = new Date(value);

    return !isNaN(date.getTime());
}

describe('Blockchain', (): void => {
    let blockchain: Blockchain;

    beforeEach( (): void => {
        blockchain = new Blockchain();
    });

    it('should create a blockchain object', (): void => {
        expect(blockchain).toBeDefined();
    });

    it('should create a hash', (): void => {
        const block: BlockI = {
            index: 1,
            timestamp: 0,
            transactions: [],
            nonce: 1,
            previousBlockHash: '0',
            hash: '0'
        } as const;
        const hash: string = blockchain.createHash(block);

        expect(hash).toEqual('cf5165adaa30b14cc4002697fb551198aaffcc4e18ada760ee06b2ebe7a52688151b35941021416800149da89ba799e5d92a33b10007fb782a6e9d6b038b159d');
    });

    it('createNewBlockInChain: [should create block(s) in the blockchain]', (): void => {
        let nonce: number = 375;
        let previousBlockHash: string = '6fa3b2f0638895a768c20fb660b4f55fc6644d372c22ff45cd9d1a6f7ae018147a3966407c8c60726ebb3af182855fd1430e32f2590bcbb6b4413833f57e270d';
        let hash: string = 'bc487a7f6b3c76c5a4c9803bfe047f34413a1094f3fbf44a339d65f86d1cc325e52bb30722131a77fc1dcde71798c42a0ccc5dfc1cf7da8719d59ee1e9de6f7c';
        const block1: BlockI = blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);
        const isTimestamp: boolean = !isNaN(new Date(block1.timestamp).getTime());

        console.table(block1);
        console.log(blockchain);

        expect(block1).toBeDefined();
        expect(block1.index).toEqual(1);
        expect(isTimestamp).toBe(true);
        expect(block1.transactions.length).toEqual(0);
        expect(block1.nonce).toEqual(nonce);
        expect(block1.previousBlockHash).toEqual(previousBlockHash);
        expect(block1.hash).toEqual(hash);

        expect(blockchain.chain.length).toEqual(1);
        expect(blockchain.chain).toEqual([block1]);
        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(blockchain.pendingTransactions).toEqual([]);

        nonce = 13;
        previousBlockHash = hash;
        hash = 'xxx';

        const block2: BlockI = blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);

        console.table(block2);
        console.log(blockchain);

        expect(blockchain.chain.length).toEqual(2);
        expect(blockchain.chain).toEqual([block1, block2]);
        expect(blockchain.pendingTransactions.length).toEqual(0);
        expect(blockchain.pendingTransactions).toEqual([]);
    });

    // it('should create a block in the blockchain', (): void => {
    //     const block: BlockI = blockchain.createNewBlockInChain(375, '77dfa5te5d4d90d9892ee2325959afbe', '01dfae6e5d4d90d9892622325959afbe');
    //
    //     expect(block).toBeDefined();
    // });
});
