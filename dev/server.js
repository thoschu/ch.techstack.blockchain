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

        const bitcoin = new BlockChain(server.info.uri);

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
                    const payload = request.payload;
                    const newTransaction = JSON.parse(payload);
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
                            body: JSON.stringify(newTransaction)
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
                    return h.response(newBlock).code(200);
                }
            }, {
                method: 'POST',
                path: '/register-and-broadcast-node',
                handler: async (request, h) => {
                    const newNodeUrl = request.payload.newNodeUrl;

                    console.log(`register-and-broadcast-node on ${bitcoin.currentNodeUrl} - newNodeUrl: ${newNodeUrl}`);

                    if (!bitcoin.networkNodes.includes(newNodeUrl) && bitcoin.currentNodeUrl !== newNodeUrl) {
                        const fetchNodesPromisesArr = [];

                        bitcoin.networkNodes.push(newNodeUrl);

                        bitcoin.networkNodes.forEach((networkNodeUrl) => {
                            fetchNodesPromisesArr.push(fetch(`${networkNodeUrl}/register-node`, {
                                method: 'POST',
                                body: JSON.stringify({newNodeUrl: newNodeUrl})
                            }));
                        });

                        return await Promise.all(fetchNodesPromisesArr).then(async (res) => {
                            const allNetworkNodes = [bitcoin.currentNodeUrl, ...bitcoin.networkNodes];

                            return await fetch(`${newNodeUrl}/register-nodes-bulk`, {
                                method: 'POST',
                                body: JSON.stringify({allNetworkNodes: allNetworkNodes})
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
                    const payload = JSON.parse(request.payload);
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
                    const payload = JSON.parse(request.payload);
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
                method: '*',
                path: '/',
                handler: (request, h) => {
                    return h.redirect('/blockchain').code(309);
                }
            }
        ]);

        const ckeckNodeUrl = (tempNodeUrl) => {
            return !bitcoin.networkNodes.includes(tempNodeUrl) && bitcoin.currentNodeUrl !== tempNodeUrl;
        };

        await server.start();

        console.log('Server running on %s', server.info.uri);
    })();

    process.on('unhandledRejection', (err) => {
        console.log(err);

        process.exit(1);
    });
}
