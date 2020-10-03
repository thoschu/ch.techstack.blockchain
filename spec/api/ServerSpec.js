'use strict';

let server;

describe('api - server.js Test', () => {

    // https://hapi.dev/tutorials/testing/?lang=en_US

    beforeAll(() => {
        server = require('../../dev/server.js');
    });

    afterAll(() => {
        // server.close();
        console.log('******', server);
    });

    describe('blockchain constructor', () => {

        it('1. test nodeIdentifier', () => {
            expect(true).toBe(true);
        });
    });
});


