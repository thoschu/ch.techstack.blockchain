import { Blockchain } from '@/blockchain';
import { BlockI } from '@/block/block.interface';

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
        };

        const hash: string = blockchain.getHash(block);

        expect(hash).toEqual('cf5165adaa30b14cc4002697fb551198aaffcc4e18ada760ee06b2ebe7a52688151b35941021416800149da89ba799e5d92a33b10007fb782a6e9d6b038b159d');
    });

    it('should create a block and retrieve it', (): void => {
        const block: BlockI = blockchain.createNewBlockInChain(375, '77dfa5te5d4d90d9892ee2325959afbe', '01dfae6e5d4d90d9892622325959afbe');

        expect(block).toBeDefined();
    });

    // it('should create a block in the blockchain', (): void => {
    //     const block: BlockI = blockchain.createNewBlockInChain(375, '77dfa5te5d4d90d9892ee2325959afbe', '01dfae6e5d4d90d9892622325959afbe');
    //
    //     expect(block).toBeDefined();
    // });
});
