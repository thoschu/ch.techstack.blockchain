# thoschu/ch.techstack.blockchain

⚠️ UNDER CONSTRUCTION ⚠️

## blockchain.js

```javascript
function Blockchain(currentNodeUrl, nodeIdentifier);
```

```javascript
Blockchain.prototype.isChainValid = function (blockchain);
```

```javascript
Blockchain.prototype.currentBlockData = function ();
```

```javascript
Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData);
```

```javascript
Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce);
```

```javascript
Blockchain.prototype.hash = function (dataAsString);
```

```javascript
Blockchain.prototype.createNewTransaction = function(amount, sender, recipient);
```

```javascript
Blockchain.prototype.addTransactionToPendingTransaction = function(newTransaction);
```

```javascript
Blockchain.prototype.getLastBlock = function();
```

```javascript
Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash);
```

## server.js

```ecmascript 6
{
    method: 'GET',
    path: '/blockchain'
}
```

```ecmascript 6
{
    method: 'GET',
    path: '/blockchain/hash'
}
```

```ecmascript 6
{
    method: 'POST',
    path: '/transaction'
}
```

```ecmascript 6
{   
    method: 'POST',
    path: '/transaction/broadcast'
}
```

```ecmascript 6
{         
    method: 'GET',
    path: '/mine'
}
```

```ecmascript 6
{
    method: 'POST',
    path: '/receive-new-block'
}
```

```ecmascript 6
{
    method: 'POST',
    path: '/register-and-broadcast-node'
}
```

```ecmascript 6
{
    method: 'POST',
    path: '/register-node'
}
```

```ecmascript 6
{    
    method: 'POST',
    path: '/register-nodes-bulk'
}
```

```ecmascript 6
{    
    method: 'GET',
    path: '/consensus'
}
```

## 💡

![Network](./assets/blockchain-network-flow.png "Network")

![Transaction](./assets/blockchain-transaction-flow.png "Transaction")

![Mine](./assets/blockchain-mine-flow.png "Mine")

#

Software made with <img src="https://www.thomas-schulte.de/images/made_with_love.gif" width="32" height="32"> in Hamburg - Germany.
