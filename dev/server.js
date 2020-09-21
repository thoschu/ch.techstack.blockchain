'use strict';

const cluster = require('cluster');
const os = require('os');
const R = require('ramda');
const Hapi = require('@hapi/hapi');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const BlockChain = require('./blockchain');

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;

    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const port = `300${R.takeLast(1, `${process.pid}`)}`;

    console.log(`# Worker ${process.pid} started. ${port}`);

    (async () => {
        const server = Hapi.server({
            port: port,
            host: 'localhost'
        });

        const nodeAddress = uuidv4();
        const bitcoin = new BlockChain(server.info.uri, nodeAddress);

        server.route([
            {
                method: 'GET',
                path: '/blockchain',
                handler: (request, h) => {
                    return h.response(bitcoin).code(200);
                }
            }, {
                method: 'POST',
                path: '/transaction',
                handler: (request, h) => {
                    const newTransaction = request.payload;
                    const blockIndex = bitcoin.addTransactionToPendingTransaction(newTransaction);

                    return h.response({note: `Transaction will be added in block ${blockIndex}.`}).code(200);
                }
            }, {
                method: 'POST',
                path: '/transaction/broadcast',
                handler: async (request, h) => {
                    const fetchPromises = [];
                    const payload = request.payload;
                    const amount = payload.amount;
                    const sender = payload.sender;
                    const recipient = payload.recipient;
                    const newTransaction = bitcoin.createNewTransaction(amount, sender, recipient);

                    bitcoin.addTransactionToPendingTransaction(newTransaction);

                    bitcoin.networkNodes.forEach(networkNodeUrl => {
                        fetchPromises.push(fetch(`${networkNodeUrl}/transaction`, {
                            method: 'POST',
                            body: JSON.stringify(newTransaction),
                            headers: {'Content-Type': 'application/json'}
                        }));
                    });

                    return await Promise.all(fetchPromises).then(res => {
                        console.log('Transaction created and broadcast successfully.');

                        return h.response(res).code(200);
                    });
                }
            }, {
                method: 'GET',
                path: '/mine',
                handler: (request, h) => {
                    const lastBlock = bitcoin.getLastBlock();
                    const previousBlockHash = lastBlock.hash;
                    const currentBlockData = bitcoin.currentBlockData();
                    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
                    const hash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
                    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, hash);
                    const fetchPromises = [];

                    bitcoin.networkNodes.forEach((networkNodeUrl) => {
                        fetchPromises.push(fetch(`${networkNodeUrl}/receive-new-block`, {
                            method: 'POST',
                            body: JSON.stringify(newBlock),
                            headers: {'Content-Type': 'application/json'}
                        }));
                    });

                    return Promise.all(fetchPromises).then(res => {
                        const newTransaction = {
                            amount: 12.5,
                            sender: "00",
                            recipient: nodeAddress
                        };

                        return fetch(`${bitcoin.currentNodeUrl}/transaction/broadcast`, {
                            method: 'POST',
                            body: JSON.stringify(newTransaction),
                            headers: {'Content-Type': 'application/json'}
                        });

                    }).then(res => {
                        // console.dir(res);

                        return h.response({note: 'New block mined & broadcast successfully.', block: newBlock}).code(200);
                    });
                }
            }, {
                method: 'POST',
                path: '/receive-new-block',
                handler: (request, h) => {
                    let note, statusCode;
                    const newBlock = request.payload;
                    const lastBock = bitcoin.getLastBlock();
                    const correctHash = lastBock.hash === newBlock.previousBlockHash;
                    const correctIndex = lastBock.index + 1 === newBlock.index;

                    if (correctHash && correctIndex) {
                        bitcoin.chain.push(newBlock);
                        bitcoin.pendingTransactions = [];
                        note = 'New Block received and accepted.';
                        statusCode = 201;
                    } else {
                        note = 'New Block received but not accepted.';
                        statusCode = 404;
                    }

                    return h.response({note, newBlock}).code(statusCode);
                }
            }, {
                method: 'POST',
                path: '/register-and-broadcast-node',
                handler: async (request, h) => {
                    const newNodeUrl = request.payload.newNodeUrl;

                    console.log(`register-and-broadcast-node on ${bitcoin.currentNodeUrl} - newNodeUrl: ${newNodeUrl}`);

                    if (!bitcoin.networkNodes.includes(newNodeUrl) && bitcoin.currentNodeUrl !== newNodeUrl) {
                        const fetchPromises = [];

                        bitcoin.networkNodes.push(newNodeUrl);

                        bitcoin.networkNodes.forEach((networkNodeUrl) => {
                            fetchPromises.push(fetch(`${networkNodeUrl}/register-node`, {
                                method: 'POST',
                                body: JSON.stringify({newNodeUrl: newNodeUrl}),
                                headers: {'Content-Type': 'application/json'}
                            }));
                        });

                        return await Promise.all(fetchPromises).then(async (res) => {
                            const allNetworkNodes = [bitcoin.currentNodeUrl, ...bitcoin.networkNodes];

                            return await fetch(`${newNodeUrl}/register-nodes-bulk`, {
                                method: 'POST',
                                body: JSON.stringify({allNetworkNodes: allNetworkNodes}),
                                headers: {'Content-Type': 'application/json'}
                            });
                        }).then((res) => {
                            return h.response('SUCCESS').code(200);
                        });
                    } else {
                        return h.response('FAILURE').code(409);
                    }
                }
            }, {
                method: 'POST',
                path: '/register-node',
                handler: (request, h) => {
                    const payload = request.payload;
                    const newNodeUrl = payload.newNodeUrl;

                    if (!bitcoin.networkNodes.includes(newNodeUrl) && bitcoin.currentNodeUrl !== newNodeUrl) {
                        bitcoin.networkNodes.push(newNodeUrl);
                        console.log(`register-node on ${bitcoin.currentNodeUrl} - added newNodeUrl: ${newNodeUrl}`);
                    } else {
                        console.log(`register-node on ${bitcoin.currentNodeUrl} - skipped newNodeUrl: ${newNodeUrl}`);
                    }

                    return h.response({info: 'New node registered successfully.'}).code(200);
                }
            }, {
                method: 'POST',
                path: '/register-nodes-bulk',
                handler: (request, h) => {
                    const payload = request.payload;
                    const allNetworkNodes = payload.allNetworkNodes;

                    allNetworkNodes.forEach(networkNodeUrl => {
                        if (!bitcoin.networkNodes.includes(networkNodeUrl) && bitcoin.currentNodeUrl !== networkNodeUrl) {
                            bitcoin.networkNodes.push(networkNodeUrl);
                            console.log(`register-nodes-bulk on ${bitcoin.currentNodeUrl} - added networkNodeUrl: ${networkNodeUrl}`);
                        } else {
                            console.log(`register-nodes-bulk on ${bitcoin.currentNodeUrl} - skipped networkNodeUrl: ${networkNodeUrl}`);
                        }
                    });

                    return h.response({info: 'Bulk registration successful.'}).code(200);
                }
            }, {
                method: 'GET',
                path: '/consensus',
                handler: (request, h) => {
                    const fetchPromises = [];

                    bitcoin.networkNodes.forEach((networkNodeUrl) => {
                        fetchPromises.push(fetch(`${networkNodeUrl}/blockchain`).then(blockChain => blockChain.json()));
                    });

                    return Promise.all(fetchPromises).then(blockChainsArr => {
                        const currentChainLength = bitcoin.chain.length;
                        let isChainValid, note, chain;
                        let maxChainLength = currentChainLength;
                        let newLongestChain = null;
                        let newPendingTransactions = null;

                        blockChainsArr.forEach(blockChain => {
                            const tempCurrentChain = blockChain.chain;
                            const tempCurrentChainLength = tempCurrentChain.length;

                            if (tempCurrentChainLength > maxChainLength) {
                                maxChainLength = tempCurrentChainLength;
                                newLongestChain = tempCurrentChain;
                                newPendingTransactions = blockChain.pendingTransactions;
                            }
                        });

                        isChainValid = bitcoin.isChainValid(newLongestChain);

                        if (!newLongestChain || (newLongestChain && !isChainValid)) {
                            note = 'Current chain has not been replaced.';
                            chain = bitcoin.chain;
                        } else {
                            bitcoin.chain = newLongestChain;
                            bitcoin.pendingTransactions = newPendingTransactions;
                            note = 'This chain has been replaced.';
                            chain = newLongestChain;
                        }

                        return h.response({note, chain}).code(200);
                    });
                }
            }, {
                method: '*',
                path: '/',
                handler: (request, h) => {
                    return h.redirect('/blockchain').code(309);
                }
            }
        ]);

        await server.start();

        console.log('Server running on %s', server.info.uri);
    })();

    process.on('unhandledRejection', (err) => {
        console.log(err);

        process.exit(1);
    });
}
