import request, { Response } from 'supertest';

import app from '@app/main';
import { Blockchain } from '@blockchain/blockchain.class';
import Block from '@blockchain/block/block.class';
import TestAgent from "supertest/lib/agent";

describe('📍 Blockchain-API Endpoints:', (): void => {
  it('⭕ GET: "/" >>> should redirect', async (): Promise<void> => {
    const response: Response = await request(app).get('/');

    expect(response.status).toBe(301);
    expect(response.body).toEqual({});
  });

  it('⭕ GET: "/api/v3/get-chain" >>> should return the chain', async (): Promise<void> => {
    const response: Response = await request(app).get('/api/v3/get-chain');
    const { status }: Record<'status', number> = response;
    const { body } = response;

    expect(status).toBe(200);
    expect(body.length).toEqual(1);
    expect(body.chain.length).toEqual(1);
    expect(body.chain[0].coinBase).toEqual(null);
    expect(body.chain[0].data).toEqual('');
    expect(body.chain[0].index).toEqual(1);
    expect(body.chain[0].nonce).toEqual(-1);
    expect(body.chain[0].previousHash).toEqual('0000');
    expect(body.chain[0].transactions.length).toEqual(0);
  });

  it('⭕ GET: "/api/v3/get-blockchain" >>> should return the blockchain', async (): Promise<void> => {
    const response: Response = await request(app).get('/api/v3/get-blockchain');
    const { status }: Record<'status', number> = response;
    const { body } = response;
    // const blockchain: Blockchain<number> = Object.assign(new Blockchain<number>(new URL('http://0.0.0.0:4000'), 1), body.blockchain);

    expect(status).toBe(200);
    expect(body.blockchain.networkNodes).toEqual([]);
    expect(body.blockchain.chain.length).toEqual(1);
    expect(body.blockchain.transactions.length).toEqual(0);
    expect(body.blockchain.validators.length).toEqual(0);
    expect(body.blockchain.contracts.length).toEqual(0);
    expect(body.blockchain.difficulty).toEqual(4);
    expect(body.blockchain.networkNode).toEqual('http://0.0.0.0:4000/');
  });

  it('⭕ GET: "/api/v3/is-valid" >>> should return the validity of the blockchain', async (): Promise<void> => {
    const response: Response = await request(app).get('/api/v3/is-valid');
    const { status }: Record<'status', number> = response;
    const { body } = response;

    expect(status).toBe(200);
    expect(body.length).toEqual(1);
    expect(body.message).toEqual('The blockchain is valid! ✅');
  });

  it('⭕ GET: "/api/v3/get-transactions" >>> should return the transactions', async (): Promise<void> => {
    const response: Response = await request(app).get('/api/v3/get-transactions');
    const { status }: Record<'status', number> = response;
    const { body } = response;

    expect(status).toBe(200);
    expect(body.length).toEqual(0);
    expect(body.transactions).toEqual([]);
  });

  it('⭕ GET: "/api/v3/get-nodes" >>> should return all connected nodes', async (): Promise<void> => {
    const response: Response = await request(app).get('/api/v3/get-nodes');
    const { status }: Record<'status', number> = response;
    const { body } = response;

    console.log(body);

    expect(status).toBe(200);
    expect(body.length).toEqual(0);
    expect(body.nodes).toEqual([]);
    expect(body.origin).toEqual('http://0.0.0.0:4000/');
  });

  it('⭕ GET: "/api/v3/mine" >>> should mine a new blocks in the blockchain', async (): Promise<void> => {
    const mineResponse: Response = await request(app).get('/api/v3/mine');
    const getBlockchainResponse: Response = await request(app).get('/api/v3/get-blockchain');
    const { status }: Record<'status', number> = mineResponse;
    const { body } = mineResponse;

    expect(status).toBe(200);
    expect(body.message).toEqual('Congratulations, you just mined a new block successfully.');
    expect(body.block.index).toEqual(2);
    expect(body.block.transactions.length).toEqual(1);
    expect(getBlockchainResponse.body.blockchain.chain.length).toEqual(2);

    // -------------------------------------------------------------------------------

    await request(app).get('/api/v3/mine');
    await request(app).get('/api/v3/mine');

    const getBlockchainResponse2: Response = await request(app).get('/api/v3/get-blockchain');
    const { body: body2 } = getBlockchainResponse2;
    const blockchain2: Blockchain<number> = body2.blockchain;
    expect(blockchain2.chain.length).toEqual(4);

    blockchain2.chain.forEach((el: Block<number>, i: number, array: Block<number>[]) => {
      const elPreviousHash: string = el.previousHash;
      const previousHash: string = (i === 0) ? '0000' : array[i - 1].hash;

      expect(elPreviousHash).toBe(previousHash);
    });

    // -------------------------------------------------------------------------------

    const tx: Response = await request(app)
      .post('/api/v3/add-transaction')
      .send({
        "transaction": {
          "sender": "01941d4b-3cc4-70c9-8db0-21ca81a81c89",
          "receiver": "b8aa28a1f6fc4625b1f74ac3472755a0d581b3a61607131652510171276a",
          "amount": 13
        }
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    const getTransactionsResponse1: Response = await request(app).get('/api/v3/get-transactions');

    expect(tx.body.block).toBe(5);
    expect(getTransactionsResponse1.body.transactions.length).toBe(1);

    // -------------------------------------------------------------------------------

    await request(app).get('/api/v3/mine');

    const getTransactionsResponse2: Response = await request(app).get('/api/v3/get-transactions');

    expect(getTransactionsResponse2.body.transactions.length).toBe(0);

    const getBlockchainResponse3: Response = await request(app).get('/api/v3/get-blockchain');
    const blockchain3: Blockchain<number> =  getBlockchainResponse3.body.blockchain;

    expect(blockchain3.chain.length).toEqual(5);
  });

  it('⭕ POST: "/api/v3/register-node" >>> should register a new node to the network', async (): Promise<void> => {
    const superTest: TestAgent = request(app);

    const response: Response = await superTest
      .post('/api/v3/register-node').send({ node: 'http://0.0.0.0:4001/' }).set('Accept', 'application/json');
    const { status }: Record<'status', number> = response;
    const { body } = response;

    expect(status).toBe(200);
    expect(body.node).toBe('http://0.0.0.0:4000/');
    expect(body.nodes.length).toBe(1);

    const response2: Response = await superTest.post('/api/v3/register-node').send({ node: 'http://0.0.0.0:4002/' }).set('Accept', 'application/json');
    const { status: status2 }: Record<'status', number> = response2;
    const { body: body2 } = response2;

    expect(status2).toBe(200);
    expect(body2.node).toBe('http://0.0.0.0:4000/');
    expect(body2.nodes.length).toBe(2);

    const response3: Response = await superTest.post('/api/v3/register-node').send({ node: 'http://0.0.0.0:4002/' }).set('Accept', 'application/json');
    const { status: status3 }: Record<'status', number> = response3;
    const { body: body3 } = response3;

    expect(status3).toBe(200);
    expect(body3.node).toBe('http://0.0.0.0:4000/');
    expect(body3.nodes.length).toBe(2);
  });

  it('⭕ POST: "/api/v3/register-nodes-bulk" >>> should register the bulk to the node', async (): Promise<void> => {
    const superTest: TestAgent = request(app);
    const nodes: string[] = [
      "http://0.0.0.0:4000/",
      "http://0.0.0.0:4001/",
      "http://0.0.0.0:4002/",
      "http://0.0.0.0:4003/",
      "http://0.0.0.0:4003/"
    ]

    const response: Response = await superTest.post('/api/v3/register-nodes-bulk').send({ nodes }).set('Accept', 'application/json');
    const { status }: Record<'status', number> = response;
    const { body } = response;

    expect(status).toBe(200);
    expect(body.node).toBe('http://0.0.0.0:4000/');
  });

  it('⭕ POST: "/api/v3/register-broadcast-node" >>> should not register and broadcast a new node to the network', async (): Promise<void> => {
    const superTest: TestAgent = request(app);
    const node: string = 'http://0.0.0.0:4000/';

    const response: Response = await superTest.post('/api/v3/register-broadcast-node').send({ node }).set('Accept', 'application/json');
    const { status }: Record<'status', number> = response;

    expect(status).toBe(422);
  });
});
