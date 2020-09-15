const sha256 = require('sha256');

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];
}

Blockchain.prototype.hasBlock = function (blockData) {
    // sha256.
    return '437890534nr.r.-kf4oirj';
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
