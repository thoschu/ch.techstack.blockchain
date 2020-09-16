const sha256 = require('sha256');

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];

    const genesisBlock = this.createNewBlock(undefined, undefined, null);
    console.log(JSON.stringify(genesisBlock));
}

Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    let nonce = -1,
        hash = '';

    do {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    } while (!hash.substring(0, 4).startsWith('0000'));

    console.log(hash);

    return nonce;
}

Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    return sha256(dataAsString);
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient
    };

    this.pendingTransactions.push(newTransaction);

    return this.getLastBlock()['index'] + 1;
}

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
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

// class Blockchain {
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
