'use strict';

const Hapi = require('@hapi/hapi');
const BlockChain = require('./blockchain');

(async () => {
    const bitcoin = new BlockChain();
    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.route([
        // fetch entire blockchain
        {
            method: 'GET',
            path: '/blockchain',
            handler: (request, h) => {
                console.log(request);
                return 'Hello World!';
            }
        },
        // create a new transaction
        {
            method: 'POST',
            path: '/transaction',
            handler: (request, h) => {
                console.log(request);
                return 'Hello World!';
            }
        },
        // mine a new block
        {
            method: 'GET',
            path: '/mine',
            handler: (request, h) => {
                return 'xxxx!';
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
