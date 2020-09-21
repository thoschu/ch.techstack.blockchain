'use strict';

const { v4: uuidv4 } = require('uuid');
const BlockChain = require('./blockchain');

const testBlockChain = {
    "nodeIdentifier": "1236",
    "currentNodeUrl": "http://localhost:3004",
    "networkNodes": [
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3005"
    ],
    "chain": [
        {
            "index": 1,
            "timeStamp": 1600629700409,
            "transactions": [],
            "nonce": undefined,
            "previousBlockHash": null,
            "hash": "0"
        },
        {
            "index": 2,
            "timeStamp": 1600629785481,
            "transactions": [],
            "nonce": 5672,
            "previousBlockHash": "0",
            "hash": "00002b62f1205be4a02b5f13b07344e7dbbe80088ec44327c34971412405da12"
        },
        {
            "index": 3,
            "timeStamp": 1600629892750,
            "transactions": [
                {
                    "transactionId": "396e3519-5207-4326-b298-366a401fa04b",
                    "amount": 12.5,
                    "sender": "00",
                    "recipient": "cc95e5a3-c500-4622-9756-af75d71b1d54"
                },
                {
                    "transactionId": "e3d515ea-a6f4-4af2-a67d-2a62e944c014",
                    "amount": 22100,
                    "sender": "n1kjesrfnsekrfn54438493urh4d",
                    "recipient": "fdfhbvru78587464tghcrurnctnirt"
                },
                {
                    "transactionId": "36de4b35-7c56-43bf-a2cb-71cf80cad1e5",
                    "amount": 2100,
                    "sender": "n1kjesrfnsekrfn54438493urh4d",
                    "recipient": "fdfhbvru78587464tghcrurnctnirt"
                }
            ],
            "nonce": 42210,
            "previousBlockHash": "00002b62f1205be4a02b5f13b07344e7dbbe80088ec44327c34971412405da12",
            "hash": "0000bfdd3e417b10aa943c830a4fd398d7db0ec89fe97d3ba555eb5007383584"
        },
        {
            "index": 4,
            "timeStamp": 1600629939985,
            "transactions": [
                {
                    "transactionId": "82842770-040f-4d89-b46a-00bda88d2523",
                    "amount": 12.5,
                    "sender": "00",
                    "recipient": "cc95e5a3-c500-4622-9756-af75d71b1d54"
                },
                {
                    "transactionId": "7076d4e9-0bd2-4d2e-87e9-47bcae2d2bc5",
                    "amount": 10,
                    "sender": "n1kjesrfnsekrfn54438493urh4d",
                    "recipient": "fdfhbvru78587464tghcrurnctnirt"
                },
                {
                    "transactionId": "fa57d2f4-ce10-4cc7-ad4a-c936c2e4cd5c",
                    "amount": 50,
                    "sender": "n1kjesrfnsekrfn54438493urh4d",
                    "recipient": "fdfhbvru78587464tghcrurnctnirt"
                }
            ],
            "nonce": 12596,
            "previousBlockHash": "0000bfdd3e417b10aa943c830a4fd398d7db0ec89fe97d3ba555eb5007383584",
            "hash": "00004e740658354a956b78fd97a9166032869ec8b88c8104549b88bee978ff77"
        },
        {
            "index": 5,
            "timeStamp": 1600629960211,
            "transactions": [
                {
                    "transactionId": "30e0ec79-4f39-469c-9b06-f6bf52beb44d",
                    "amount": 12.5,
                    "sender": "00",
                    "recipient": "76a4d17e-3625-429d-ac1e-d3028ddc2a3b"
                }
            ],
            "nonce": 125143,
            "previousBlockHash": "00004e740658354a956b78fd97a9166032869ec8b88c8104549b88bee978ff77",
            "hash": "000080a9ea2309a995138c432e51337d70609a60f04b33ab48d19ddc7b014c3f"
        },
        {
            "index": 6,
            "timeStamp": 1600629962928,
            "transactions": [
                {
                    "transactionId": "c2018347-2a7c-43c3-b93e-ef6f5b719b51",
                    "amount": 12.5,
                    "sender": "00",
                    "recipient": "76a4d17e-3625-429d-ac1e-d3028ddc2a3b"
                }
            ],
            "nonce": 49330,
            "previousBlockHash": "000080a9ea2309a995138c432e51337d70609a60f04b33ab48d19ddc7b014c3f",
            "hash": "000057b5bf09d9035cd63db0e7dd53ebe1461b11d6f4e345751318dd42b5a908"
        }
    ],
    "pendingTransactions": [
        {
            "transactionId": "967f1869-6f15-450a-a145-33f7c31108a3",
            "amount": 12.5,
            "sender": "00",
            "recipient": "76a4d17e-3625-429d-ac1e-d3028ddc2a3b"
        }
    ]
};

const bitcoin = new BlockChain('http://0.0.0.0:3000', '1236');
// console.log(bitcoin.nodeIdentifier);
// console.log(testBlockChain.nodeIdentifier);

const isValidChain = bitcoin.isChainValid(testBlockChain.chain);

console.log(isValidChain);

// var previousBlockHash = '90343rfndc44000dccc34hzjrjnef948894jrt';
// let currentBlockData = [
//     {
//         amount: 1000,
//         sender: 'me',
//         recipient: 'you'
//
//     }, {
//         amount: 2000,
//         sender: 'tom',
//         recipient: 'tini'
//     }
// ];
//
// const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
//
// console.log(nonce);
// console.log(bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce));

// let block = bitcoin.createNewBlock(904561652, 'efef-deed-rfhw-ehde-34', '34e-dede8-305mc-jfeerfn');
//
// bitcoin.createNewTransaction(100, 'Tim', 'Andrea');
//
// bitcoin.createNewBlock(8754673267, 'efef-rfhw-ehde-34', '348-305mc-jferf-ddn');
//
// bitcoin.createNewTransaction(100, 'Tim', 'Andrea');
// bitcoin.createNewTransaction(500, 'Tim', 'Andrea');
// bitcoin.createNewTransaction(1600, 'Tim', 'Andrea');
//
// bitcoin.createNewBlock( 564551117, 'aaefef-rfhw-ehde-34', 'tz48-305mc-jferf-ddn');
//
// // console.log(bitcoin.chain[bitcoin.chain.length - 1]);
// console.log(bitcoin);
