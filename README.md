# thoschu/ch.techstack.blockchain

⚠️ UNDER CONSTRUCTION ⚠️

Software made with ![HEART](https://www.thomas-schulte.de/images/made_with_love.gif "HEART") in Germany

## blockchain.js

```javascript
function Blockchain(currentNodeUrl, nodeIdentifier);
```

```javascript
Blockchain.prototype.consensus = function ();
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

```json
{
    method: 'GET',
    path: '/blockchain'

}
```

```json
{
    method: 'POST',
    path: '/transaction'
}
```

```json
{   
    method: 'POST',
    path: '/transaction/broadcast'
}
```

```json
{         
    method: 'GET',
    path: '/mine'
}
```

```json
{
    method: 'POST',
    path: '/receive-new-block'
}
```

```json
{
    method: 'POST',
    path: '/register-and-broadcast-node'
}
```

```json
{
    method: 'POST',
    path: '/register-node'
}
```

```json
{    
    method: 'POST',
    path: '/register-nodes-bulk'
}
```

## 💡

![Network](./assets/blockchain-network-flow.png "Network")

![Transaction](./assets/blockchain-transaction-flow.png "Transaction")

![Mine](./assets/blockchain-mine-flow.png "Mine")
