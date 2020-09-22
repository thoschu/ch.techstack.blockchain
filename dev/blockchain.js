'use strict';

const sha256 = require('sha256');
const R = require('ramda');
const {v4: uuidv4} = require('uuid');

function Blockchain(currentNodeUrl, nodeIdentifier) {
    this.nodeIdentifier = nodeIdentifier;
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    this.chain = [];
    this.pendingTransactions = [];

    console.info(`${this.nodeIdentifier} # Genesis-Block created: ${JSON.stringify(this.createNewBlock(undefined, null, '0'))} on ${this.currentNodeUrl}`);
}

Blockchain.prototype.getAddressData = function (address) {
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

Blockchain.prototype.getTransactionById = function (transactionId) {
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

Blockchain.prototype.getBlockByHash = function (blockHash) {
    let correctBlock = null;

    this.chain.some(block => {
        const isHit = block.hash === blockHash;

        correctBlock = isHit ? block : correctBlock;

        return isHit;
    });

    return correctBlock;
}

Blockchain.prototype.isChainValid = function (blockchain) {
    let validChain = true;
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock.nonce === undefined;
    const correctPreviousBlockHash = genesisBlock.previousBlockHash === null;
    const correctHash = genesisBlock.hash === '0';
    const correctTransactions = genesisBlock.transactions.length === 0;
    const noValidGenesisBlock = !correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions;

    for (let i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const previousBlock = blockchain[R.dec(i)];
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

    return validChain && R.not(noValidGenesisBlock);
}

Blockchain.prototype.currentBlockData = function () {
    return {
        index: R.inc(this.getLastBlock().index),
        transactions: this.pendingTransactions,
    };
}

Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    let nonce = -1,
        hash;

    do {
        nonce = R.inc(nonce);
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    } while (R.not(hash.substring(0, 4).startsWith('0000')));

    return nonce;
}

Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const currentBlockDataAsString = JSON.stringify(currentBlockData);
    const nonceAsString = nonce.toString();
    const dataAsString = `${previousBlockHash}${nonceAsString}${currentBlockDataAsString}`;
    return this.hash(dataAsString);
}

Blockchain.prototype.hash = function (dataAsString) {
    return sha256(dataAsString);
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        transactionId: uuidv4()
    };

    newTransaction.amount = amount;
    newTransaction.sender = sender;
    newTransaction.recipient = recipient;

    return newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransaction = function(newTransaction) {
    this.pendingTransactions.push(newTransaction);

    return R.inc(this.getLastBlock()['index']);
}

Blockchain.prototype.getLastBlock = function() {
    return R.last(this.chain);
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index: R.inc(this.chain.length),
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

// export class Blockchain {
//     constructor() {
//         this.chain = [];
//         this.newTransactions = [];
//     }
//
//     createNewBlock(nonce, previousBlockHash, hash) {
//         const newBlock = this.getABlock(nonce, previousBlockHash, hash);
//
//         this.newTransactions = [];
//         this.chain.push(newBlock);
//
//         return newBlock;
//     }
//
//     getABlock(nonce, previousBlockHash, hash) {
//         const tempBlock = {
//             index: this.chain.length + 1,
//             timeStamp: Date.now(),
//             transactions: this.newTransactions,
//             nonce: nonce,
//             previousBlockHash: previousBlockHash,
//             hash: hash
//         };
//
//         return tempBlock;
//     }
// }

module.exports = Blockchain;
