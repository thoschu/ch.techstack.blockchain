const BlockChain = require('../../dev/blockchain.js');

describe('blockchain.js Test', () => {
    const currentNodeUrl = 'http://0.0.0.0:3000';
    const nodeIdentifier = '1234567';
    let bitcoin;

    beforeEach(() => {
        bitcoin = new BlockChain(currentNodeUrl, nodeIdentifier);
    });

    afterEach(() => {
        bitcoin = undefined;
    });

    describe('blockchain constructor', () => {
        it('test nodeIdentifier', () => {
            expect(bitcoin.nodeIdentifier).toBe(nodeIdentifier);
        });

        it('test currentNodeUrl', () => {
            expect(bitcoin.currentNodeUrl).toBe(currentNodeUrl);
        });

        it('test networkNodes array for the right length of 0', () => {
            expect(bitcoin.networkNodes.length).toBe(0);
        });

        it('test chain array for the right length of 1', () => {
            expect(bitcoin.chain.length).toBe(1); // genesis block
        });

        it('test pendingTransactions array for the right length of 0', () => {
            expect(bitcoin.pendingTransactions.length).toBe(0);
        });
    });

    describe('currentBlockData function', () => {
        it('test return value', () => {
            let example = {
                index: 2,
                transactions: [],
            };

            example = jasmine.objectContaining(example);

            expect(bitcoin.currentBlockData()).toEqual(example);
        });
    });

    beforeEach(() => {
        console.log('************');
    });

    describe('getLastBlock function', () => {
        it('test return value', () => {
            const getLastBlock = bitcoin.getLastBlock();
            const index = getLastBlock.index;
            const timeStamp = new Date(getLastBlock.timeStamp);
            const transactions = getLastBlock.transactions;
            const nonce = getLastBlock.nonce;
            const previousBlockHash = getLastBlock.previousBlockHash;
            const hash = getLastBlock.hash;
            const getLastBlockKeys = Object.keys(getLastBlock);
            const exampleKeys = Object.keys({
                index: 7,
                timeStamp: Date.now(),
                transactions: [],
                nonce: undefined,
                previousBlockHash: null,
                hash: "0"
            });

            for (let i = 0; i < exampleKeys.length; i++) {
                expect(getLastBlockKeys).toContain(exampleKeys[i]);
            }

            expect(index).toBe(1);
            expect(timeStamp.getFullYear()).toBe(new Date().getFullYear());
            expect(transactions).toEqual([]);
            expect(nonce).toBeUndefined();
            expect(previousBlockHash).toBeNull();
            expect(hash).toBe("0");
        });
    });

    describe('proofOfWork function', () => {
        it('test return value', () => {
            const getLastBlock = bitcoin.getLastBlock();
            const previousBlockHash = getLastBlock.hash;
            const currentBlockData = bitcoin.currentBlockData();
            const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData)

            expect(nonce).toBe(5672);
        });
    });

    describe('hash function', () => {
        it('test return value', () => {
            const expected = '8bb0cf6eb9b17d0f7d22b456f121257dc1254e1f01665370476383ea776df414';
            const hash = bitcoin.hash(nodeIdentifier);

            expect(hash).toBe(expected);
        });
    });

    describe('hashBlock function', () => {
        it('test return value', () => {
            const getLastBlock = bitcoin.getLastBlock();
            const previousBlockHash = getLastBlock.hash;
            const currentBlockData = bitcoin.currentBlockData();
            const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
            const hashBlockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
            const hashStartsWith0000 =  hashBlockHash.startsWith('0000');

            expect(hashStartsWith0000).toBeTruthy();
        });
    });

    describe('createNewBlock function', () => {
        it('test return value', () => {
            const getLastBlock = bitcoin.getLastBlock();
            const previousBlockHash = getLastBlock.hash;
            const currentBlockData = bitcoin.currentBlockData();
            const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
            const hash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
            const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, hash);

            console.log(nonce);
            // console.log(newBlock);
            // console.log(bitcoin);

            expect(newBlock).toBeTruthy();
        });
    });
});


