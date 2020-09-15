function Blockchain1() {
    this.chain = [];
    this.newTransactions = [];
}

Blockchain1.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timeStamp: Date.now(),
        transactions: this.newTransactions,
        nonce: nonce,
        previousBlockHash: previousBlockHash,
        hash: hash
    };

    this.newTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.newTransactions = [];
    }

    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = this.getBlock(nonce, previousBlockHash, hash);

        this.newTransactions = [];
        this.chain.push(newBlock);

        return newBlock;
    }

    getBlock(nonce, previousBlockHash, hash) {
        const tempBlock = {
            index: this.chain.length + 1,
            timeStamp: Date.now(),
            transactions: this.newTransactions,
            nonce: nonce,
            previousBlockHash: previousBlockHash,
            hash: hash
        };

        return tempBlock;
    }
}

module.exports = Blockchain1;
