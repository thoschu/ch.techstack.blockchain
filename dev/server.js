'use strict';

// const cluster = require('cluster');
// const os = require('os');
//
// if (cluster.isMaster) {
//     const numCPUs = os.cpus().length;
//     console.log(`Master ${process.pid} is running`);
//
//     // Fork workers.
//     for (let i = 0; i < numCPUs; i++) {
//         cluster.fork();
//     }
//
//     cluster.on('exit', (worker, code, signal) => {
//         console.log(`worker ${worker.process.pid} died`);
//     });
// } else {
//     // Workers can share any TCP connection
//     // In this case it is an HTTP server
//
//     console.log(`Worker ${process.pid} started`);
// }

const Hapi = require('@hapi/hapi');
const BlockChain = require('./blockchain');

(async () => {
    const server = Hapi.server({
        port: 3000,
        host: '0.0.0.0'
    });

    const bitcoin = new BlockChain();

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
                return blockIndex;
            }
        }, {
            method: 'GET',
            path: '/mine',
            handler: (request, h) => {
                const lastBlock = bitcoin.getLastBlock();
                const previousBlockHash =  lastBlock.hash;
                const currentBlockData = {
                    transactions:  bitcoin.pendingTransactions,
                    index:  bitcoin.pendingTransactions.index + 1
                };
                const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
                const hash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);

                return bitcoin.createNewBlock(nonce, previousBlockHash, hash);
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
