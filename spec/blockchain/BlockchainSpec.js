'use strict';

const {validate: validateUuidv4} = require('uuid');

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
        it('1. test nodeIdentifier', () => {
            expect(bitcoin.nodeIdentifier).toBe(nodeIdentifier);
        });

        it('2. test currentNodeUrl', () => {
            expect(bitcoin.currentNodeUrl).toBe(currentNodeUrl);
        });

        it('3. test networkNodes array for the right length of 0', () => {
            expect(bitcoin.networkNodes.length).toBe(0);
        });

        it('4. test chain array for the right length of 1', () => {
            expect(bitcoin.chain.length).toBe(1); // genesis block
        });

        it('5. test pendingTransactions array for the right length of 0', () => {
            expect(bitcoin.pendingTransactions.length).toBe(0);
        });
    });

    describe('currentBlockData function', () => {
        it('6. test return value', () => {
            let example = {
                index: 2,
                transactions: [],
            };

            example = jasmine.objectContaining(example);

            expect(bitcoin.currentBlockData()).toEqual(example);
        });
    });

    describe('getLastBlock function', () => {
        it('7. test return value', () => {
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
        it('8. test return value', () => {
            const getLastBlock = bitcoin.getLastBlock();
            const previousBlockHash = getLastBlock.hash;
            const currentBlockData = bitcoin.currentBlockData();
            const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData)

            expect(nonce).toBe(5672);
        });
    });

    describe('hash function', () => {
        it('9. test return value', () => {
            const expected = '8bb0cf6eb9b17d0f7d22b456f121257dc1254e1f01665370476383ea776df414';
            const hash = bitcoin.hash(nodeIdentifier);

            expect(hash).toBe(expected);
        });
    });

    describe('hashBlock function', () => {
        it('10. test return value', () => {
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
        let getLastBlock,
            previousBlockHash,
            currentBlockData ,
            nonce ,
            hash,
            newBlock;

        beforeEach(() => {
            getLastBlock = bitcoin.getLastBlock();
            previousBlockHash = getLastBlock.hash;
            currentBlockData = bitcoin.currentBlockData();
            nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
            hash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
            newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, hash);
        });

        it('11. test return value', () => {
            expect(newBlock.index).toBe(2);
            expect(new Date(newBlock.timeStamp).getFullYear()).toBe(new Date().getFullYear());
            expect(newBlock.transactions).toEqual([]);
            expect(newBlock.nonce).toBe(nonce);
            expect(newBlock.previousBlockHash).toBe(previousBlockHash);
            expect(newBlock.hash).toBe(hash);
        });

        it('12. test bitcoin.chain array length after new block creation', () => {
            expect(bitcoin.chain.length).toBe(2);
        });

        it('13. test bitcoin.chain array for new block after new block creation', () => {
            const foundBlock = bitcoin.chain.find(block => block == newBlock);

            expect(foundBlock).not.toBeUndefined();
        });

        it('14. test bitcoin.pendingTransactions array length after new block creation', () => {
            const pendingTransactions = bitcoin.pendingTransactions;

            expect(pendingTransactions.length).toBe(0);
        });
    });

    describe('createNewTransaction function', () => {
        it('15. test return value', () => {
            const amount = 1977, sender = '13', recipient = '7'
            const newTransaction = bitcoin.createNewTransaction(amount, sender, recipient);

            expect(validateUuidv4(newTransaction.transactionId)).toBeTrue();
            expect(newTransaction.amount).toBe(amount);
            expect(newTransaction.sender).toBe(sender);
            expect(newTransaction.recipient).toBe(recipient);
        });
    });

    describe('addTransactionToPendingTransaction function', () => {
        const amount = 1977, sender = '13', recipient = '7'

        it('16. test return value', () => {
            const newTransaction = bitcoin.createNewTransaction(amount, sender, recipient);
            const newTransactionBlockIndex = bitcoin.addTransactionToPendingTransaction(newTransaction);

            expect(newTransactionBlockIndex).toBe(2);
        });

        it('17. test bitcoin.pendingTransactions array length before and after new transaction creation and adding to pendingTransactions array', () => {
            const newTransaction = bitcoin.createNewTransaction(amount, sender, recipient);

            expect(bitcoin.pendingTransactions.length).toBe(0);

            bitcoin.addTransactionToPendingTransaction(newTransaction);

            expect(bitcoin.pendingTransactions.length).toBe(1);
        });
    });

    describe('isChainValid function', () => {
        it('18. test return value', () => {
            let getLastBlock = bitcoin.getLastBlock(),
                previousBlockHash = getLastBlock.hash,
                currentBlockData = bitcoin.currentBlockData(),
                nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData),
                hash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce),
                isChainValid;

            bitcoin.createNewBlock(nonce, previousBlockHash, hash);
            isChainValid = bitcoin.isChainValid(bitcoin.chain);

            expect(isChainValid).toBeTrue();

            bitcoin.createNewBlock('xxxx', previousBlockHash, hash);
            isChainValid = bitcoin.isChainValid(bitcoin.chain);

            expect(isChainValid).toBeFalse();
        });
    });

    describe('getBlockByHash function', () => {
        it('19. test return value', () => {
            let getLastBlock = bitcoin.getLastBlock(),
                previousBlockHash = getLastBlock.hash,
                currentBlockData = bitcoin.currentBlockData(),
                nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData),
                hash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce),
                createdNewBlock = bitcoin.createNewBlock(nonce, previousBlockHash, hash),
                fetchedBlock = bitcoin.getBlockByHash(createdNewBlock.hash);

            expect(createdNewBlock).toBe(fetchedBlock);

            getLastBlock = bitcoin.getLastBlock();
            previousBlockHash = getLastBlock.hash;
            currentBlockData = bitcoin.currentBlockData();
            nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
            hash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
            createdNewBlock = bitcoin.createNewBlock(nonce, previousBlockHash, hash);
            fetchedBlock = bitcoin.getBlockByHash(createdNewBlock.hash);

            expect(createdNewBlock).toBe(fetchedBlock);
        });
    });
});


