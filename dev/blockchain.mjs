'use strict';

import * as sha256 from 'sha256';
import {dec, inc, last, not} from 'ramda';
import * as uuid from 'uuid';

export class Blockchain {
    constructor(currentNodeUrl, nodeIdentifier) {
        this.nodeIdentifier = nodeIdentifier;
        this.currentNodeUrl = currentNodeUrl;
        this.networkNodes = [];

        this.chain = [];
        this.pendingTransactions = [];

        console.info(`${this.nodeIdentifier} # Genesis-Block created: ${JSON.stringify(this.createNewBlock(undefined, null, '0'))} on ${this.currentNodeUrl}`);
    }

    getAddressData(address) {
        let balance = 0;
        const addressTransactions = [];

        this.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                const isSenderHit = transaction.sender === address;
                const isRecipientHit = transaction.recipient === address;

                if (isSenderHit || isRecipientHit) {
                    addressTransactions.push(transaction);
                }
            });
        });

        addressTransactions.forEach(transaction => {
            if (transaction.recipient === address) {
                balance += transaction.amount;
            } else if (transaction.sender === address) {
                balance -= transaction.amount;
            }
        });

        return {
            addressTransactions,
            balance
        };
    }

    getTransactionById(transactionId) {
        let correctTransaction = null;
        let correctBlock = null;

        this.chain.some(block => {
            return block.transactions.some(transaction => {
                const isHit = transaction.transactionId === transactionId;

                if (isHit) {
                    correctTransaction = transaction;
                    correctBlock = block;
                }

                return isHit;
            });
        });

        return {
            transaction: correctTransaction,
            block: correctBlock
        };
    }

    getBlockByHash(blockHash) {
        let correctBlock = null;

        this.chain.some(block => {
            const isHit = block.hash === blockHash;

            correctBlock = isHit ? block : correctBlock;

            return isHit;
        });

        return correctBlock;
    }

    isChainValid(blockchain) {
        let validChain = true;
        const genesisBlock = blockchain[0];
        const correctNonce = genesisBlock.nonce === undefined;
        const correctPreviousBlockHash = genesisBlock.previousBlockHash === null;
        const correctHash = genesisBlock.hash === '0';
        const correctTransactions = genesisBlock.transactions.length === 0;
        const noValidGenesisBlock = !correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions;

        for (let i = 1; i < blockchain.length; i++) {
            const currentBlock = blockchain[i];
            const previousBlock = blockchain[dec(i)];
            const tempBlockData = {
                index: currentBlock.index,
                transactions: currentBlock.transactions
            };
            const blockHash = this.hashBlock(previousBlock.hash, tempBlockData, currentBlock.nonce);

            // console.log('previousBlock.hash ->', previousBlock.hash);
            // console.log('currentBlock.hash ->', currentBlock.hash);

            if ((!blockHash.substring(0, 4).startsWith('0000')) && currentBlock.previousBlockHash !== previousBlock.hash) {
                validChain = false;
                break;
            }
        }

        return validChain && not(noValidGenesisBlock);
    }

    currentBlockData() {
        return {
            index: inc(this.getLastBlock().index),
            transactions: this.pendingTransactions,
        };
    }

    proofOfWork(previousBlockHash, currentBlockData) {
        let nonce = -1,
            hash;

        do {
            nonce = inc(nonce);
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        } while (not(hash.substring(0, 4).startsWith('0000')));

        return nonce;
    }

    hashBlock(previousBlockHash, currentBlockData, nonce) {
        const currentBlockDataAsString = JSON.stringify(currentBlockData);
        const nonceAsString = nonce.toString();
        const dataAsString = `${previousBlockHash}${nonceAsString}${currentBlockDataAsString}`;

        return this.hash(dataAsString);
    }

    hash(dataAsString) {
        return sha256(dataAsString);
    }


    createNewTransaction(amount, sender, recipient) {
        const newTransaction = {
            transactionId: uuid.v4()
        };

        newTransaction.amount = amount;
        newTransaction.sender = sender;
        newTransaction.recipient = recipient;

        return newTransaction;
    }

    addTransactionToPendingTransaction(newTransaction) {
        this.pendingTransactions.push(newTransaction);

        return inc(this.getLastBlock()['index']);
    }

    getLastBlock() {
        return last(this.chain);
    }

    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = {
            index: inc(this.chain.length),
            timeStamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            previousBlockHash: previousBlockHash,
            hash: hash
        };

        this.pendingTransactions = [];
        this.chain.push(newBlock);

        return newBlock;
    }
}
