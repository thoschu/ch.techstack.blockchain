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
    const port = 300 + R.takeLast(1, `${process.pid}`);

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
                    const blockIndex = bitcoin.createNewTransaction(request.payload.amount, request.payload.sender, request.payload.recipient);
                    console.log('This transaction will be added to block: ' + blockIndex);
                    return h.response(blockIndex).code(200);
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
                    return h.response(bitcoin.createNewBlock(nonce, previousBlockHash, hash)).code(200);
                }
            }, {
                method: 'POST',
                path: '/register-and-broadcast-node',
                handler: async (request, h) => {
                    const newNodeUrl = request.payload.newNodeUrl;

                    if (!bitcoin.networkNodes.includes(newNodeUrl)) {
                        const fetchNodesPromisesArr = [];

                        bitcoin.networkNodes.push(newNodeUrl);
                        bitcoin.networkNodes.forEach((networkNodeUrl) => {
                            const address = `${networkNodeUrl}/register-node`;

                            fetchNodesPromisesArr.push(fetch(address, {
                                method: 'POST',
                                body: {newNodeUrl: newNodeUrl}
                            }));
                        });

                        await Promise.all(fetchNodesPromisesArr).then(async res => {
                            console.dir(res);
                            return await fetch(newNodeUrl + '/register-nodes-bulk', {
                                allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]
                            })
                        }).then(res => {
                            console.log(res);
                            return h.response('SUCCESS').code(200);
                        });
                    }
                }
            }, {
                method: 'POST',
                path: '/register-node',
                handler: (request, h) => {
                    let returnText, returnStatusCode;
                    const newNodeUrl = request.payload.newNodeUrl;

                    if (!bitcoin.networkNodes.includes(newNodeUrl) && bitcoin.currentNodeUrl !== newNodeUrl) {
                        bitcoin.networkNodes.push(newNodeUrl);
                        returnText = 'New node registered successfully.';
                        returnStatusCode = 200;
                    } else {
                        returnText = 'Node not registered successfully.';
                        returnStatusCode = 409;
                    }

                    return h.response({info: returnText, code: returnStatusCode}).code(returnStatusCode);
                }
            }, {
                method: 'POST',
                path: '/register-nodes-bulk',
                handler: (request, h) => {
                    const allNetworkNodes = request.payload.allNetworkNodes;

                    allNetworkNodes.forEach(networkNodeUrl => {
                        if (!bitcoin.networkNodes.includes(networkNodeUrl) && bitcoin.currentNodeUrl !== networkNodeUrl) {
                            bitcoin.networkNodes.push(networkNodeUrl);
                        }
                    });

                    return h.response({info: 'Bulk registration successful.', code: '200'}).code(200);
                }
            }, {
                method: '*',
                path: '/',
                handler: (request, h) => {
                    return h.response(h.response.statusCode = 404).code(404);
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
