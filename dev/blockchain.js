const sha256 = require('sha256');
const R = require('ramda');
const { v4: uuidv4 } = require('uuid');

function Blockchain(currentNodeUrl) {
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    this.chain = [];
    this.pendingTransactions = [];

    console.info(`Genesis-Block created: ${JSON.stringify(this.createNewBlock(undefined, null, '0'))} on ${bitcoin.currentNodeUrl}`);
}

Blockchain.prototype.currentBlockData = function () {
    return {
        index: R.inc(this.getLastBlock().index) ,
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
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
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

    return this.getLastBlock()['index'] + 1;
}

Blockchain.prototype.getLastBlock = function() {
    // return this.chain[this.chain.length - 1];
    return R.last(this.chain);
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
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
