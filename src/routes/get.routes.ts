import { ECDH, randomBytes, createECDH, createHash } from 'crypto';
import { env } from 'process';
import bs58 from 'bs58';
import { Router, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { forkJoin, from, Observable } from 'rxjs';
import {all, equals, inc, prop } from 'ramda';
import axios, { AxiosResponse } from 'axios';

import { blockchain } from '@app/main';
import Block from '@blockchain/block/block.class';
import { Transaction } from '@blockchain/transaction/transaction.class';
import { Blockchain, BlockData } from '@blockchain/blockchain.class';

const apiKey: string  = env.API_KEY!;

const router: Router = Router();

router.get('/info', async (req: Request, res: Response) => {
  const headers = {
    Accept: 'application/json',
    'X-API-Token': apiKey
  };

  const promRes: unknown = await fetch('https://api.blockchain.com/v3/exchange/tickers',{
    method: 'GET',
    headers
  })
    .then((res) => {
      return res.json();
    });

  res.send(promRes);
});

router.get('/get-blockchain', (req: Request, res: Response): void => {
  res.send({
    blockchain: {
      networkNodes: [...blockchain.networkNodes],
      timestamp: blockchain.timestamp,
      id: blockchain.id,
      chain: blockchain.chain,
      transactions: blockchain.transactions,
      validators: blockchain.validators,
      contracts: [...blockchain.contracts],
      networkNode: blockchain.networkNode,
      difficulty: blockchain.difficulty
    }
  });
});

router.get('/is-valid', (req: Request, res: Response): void => {
  const isValid: boolean = blockchain.chainIsValid(blockchain.chain);

  res.send({
    'message': isValid ? 'The blockchain is valid! ✅' : 'The blockchain is not valid! ❌',
    'length': blockchain.chain.length
  });
});

router.get('/get-chain', (req: Request, res: Response): void => {
  res.send({
    'length': blockchain.chain.length,
    'chain': blockchain.chain,
  });
});

router.get('/get-transactions', (req: Request, res: Response): void => {
  res.send({
    'length': blockchain.transactions.length,
    'transactions': blockchain.transactions,
  });
});

router.get('/get-nodes', (req: Request, res: Response): void => {
  const nodes: string[] = [...blockchain.networkNodes];
  const origin: string = blockchain.networkNode;
  const length: number = nodes.length;

  res.send({ length, nodes, origin });
});

router.get('/mine', (req: Request, res: Response): void => {
  const previousBlock: Block<number> = blockchain.getPreviousBlock();
  const previousHash: string = prop<'hash', Block<number>>('hash', previousBlock);
  const { transactions }: Record<'transactions', Transaction<number>[]> = blockchain;
  const index: number = inc(prop<'index', Block<number>>('index', previousBlock));
  const blockData: BlockData<number> = { transactions, index };
  const nonce: number = blockchain.proofOfWork(previousHash, blockData);
  const hash: string = blockchain.hashBlock(previousHash, blockData, nonce);
  const block: Block<number> = blockchain.createBlock(nonce, previousHash, hash);
  const data: Record<'block', Block<number>> = { block };
  const axiosObservableList: Observable<AxiosResponse>[] = [];
  const { networkNodes: nodes }: Record<'networkNodes', Set<string>> = blockchain;
  const axiosObservable$: Observable<AxiosResponse[]> = forkJoin<AxiosResponse[]>(axiosObservableList);

  for (const networkNode of nodes) {
    const axiosPostPromise: Promise<AxiosResponse> = axios.post(`${networkNode}api/v3/receive-new-block`, data);

    axiosObservableList.push(from<Promise<AxiosResponse>>(axiosPostPromise));
  }

  axiosObservable$.subscribe((responses: AxiosResponse[]): void => {
    const responseMapStatus: number[] = responses.map<number>((value: AxiosResponse): number => value.status);
    const httpStatusCodeOk: number = 200;
    const equals200: (eq: number) => boolean = equals<number>(httpStatusCodeOk);
    const receiveNewBlockPostIsValidStatus: boolean = all<number>(equals200)(responseMapStatus);

    if(receiveNewBlockPostIsValidStatus) {
      const { networkNode }: Record<'networkNode', string> = blockchain;
      const transaction: Transaction<number> = blockchain.createTransaction('system', Blockchain.nodeAddress, 1);
      const { sender, receiver, amount }: { sender: string; receiver: string; amount: number; } = transaction;
      const data: { transaction: { sender: string ; receiver: string ; amount: number; } } = { transaction: { sender, receiver, amount } };
      const axiosPromise: Promise<AxiosResponse> = axios.post(`${networkNode}api/v3/transaction/broadcast`, data);

      axiosPromise.then((response: AxiosResponse): void => {
        res.status(response.status).send({
          message: 'New block mined & broadcast successfully',
          block
        });
      }).catch((error: Error): void => {
        res.status(500).send({
          'message': 'Error, the block was not broadcast to the network.',
          block,
          error
        });
      });
    } else {
      res.status(500).send({
        'message': 'Error, the block was not broadcast to the network.',
        block
      });
    }
  });
});

router.get('/replace-chain', async (req: Request, res: Response): Promise<void> => {
  const isChainReplaced: boolean = await blockchain.replaceChain();

  res.send({
    'message': isChainReplaced ? 'The nodes had different chains ❗' : 'All good, the chain is the largest one ✅',
    'chain': blockchain.chain,
    'length': blockchain.chain.length
  });
});

router.get('/generate-private-key', async (req: Request, res: Response): Promise<void> => {
  const bytes: Buffer = randomBytes(32);
  const key: string = bytes.toString('hex');
  const ecdh: ECDH = createECDH('secp256k1');

  ecdh.setPrivateKey(bytes);

  res.send(
    key
  );
});

router.get('/generate-public-key', async (req: Request, res: Response): Promise<void> => {
  const privateKey: string = <string>req.query.key;
  const ecdh: ECDH = createECDH('secp256k1');
  ecdh.setPrivateKey(privateKey, 'hex');
  const key: Buffer = ecdh.getPublicKey(null, 'compressed');

  res.send(key.toString('hex'));
});

router.get('/create-blockchain-address', async (req: Request, res: Response): Promise<void> => {
  const publicKey: string = <string>req.query.key;
  const sha256: Buffer = createHash('sha256').update(publicKey).digest();
  const ripemd160: Buffer = createHash('ripemd160').update(sha256).digest();
  const versionedPayload: Buffer = Buffer.concat([Buffer.from([0x00]), ripemd160]);
  const checksum: Buffer = createHash('sha256')
    .update(createHash('sha256').update(versionedPayload).digest())
    .digest()
    .slice(0, 4);
  const address: string = bs58.encode(Buffer.concat([versionedPayload, checksum]));

  res.send(address);
});

router.get('/consensus', (req: Request, res: Response): void => {
  const networkNodes: string[] = [...blockchain.networkNodes];

  if(networkNodes.length !== 0) {
    const axiosObservableList: Observable<AxiosResponse>[] = [];
    const axiosObservable$: Observable<AxiosResponse[]> = forkJoin<AxiosResponse[]>(axiosObservableList);

    for (const networkNode of networkNodes) {
      const axiosGetPromise: Promise<AxiosResponse> = axios.get(`${networkNode}api/v3/get-blockchain`);

      axiosObservableList.push(from<Promise<AxiosResponse>>(axiosGetPromise));
    }

    axiosObservable$.subscribe((responses: AxiosResponse[]): void => {
      const responseMapStatus: number[] = responses.map<number>((value: AxiosResponse): number => value.status);
      const httpStatusCodeOk: number = 200;
      const equals200: (eq: number) => boolean = equals<number>(httpStatusCodeOk);
      const receiveNewBlockPostIsValidStatus: boolean = all<number>(equals200)(responseMapStatus);

      if(receiveNewBlockPostIsValidStatus) {
        const responseMapData: Record<'blockchain', Blockchain<number>>[] = responses.map((value: AxiosResponse) => value.data);
        const { chain: chainLocale }: Record<'chain', Block<number>[]> = blockchain;
        const { length: currentChainLengthLocale }: Record<'length', number> = chainLocale;
        let maxChainLength: number = currentChainLengthLocale;
        let newLongestChain: Block<number>[] | null = null;
        let newPendingTransactions: Transaction<number>[] | null = null;

        for (const responseMapDataElement of responseMapData) {
          const { blockchain: blockchainRemote }: Record<'blockchain', Blockchain<number>> = responseMapDataElement;
          const { chain: chainRemote }: Record<'chain', Block<number>[]> = blockchainRemote;
          const { length: chainLengthRemote }: Record<'length', number> = chainRemote;
          const { transactions: transactionsRemote }: Record<'transactions', Transaction<number>[]> = blockchainRemote;

          if(chainLengthRemote > maxChainLength) {
            maxChainLength = chainLengthRemote;
            newLongestChain = chainRemote;
            newPendingTransactions = transactionsRemote;
          }
        }

        if(!newLongestChain || (newLongestChain && !blockchain.chainIsValid(newLongestChain))) {
          res.send({
            message: 'Current chain has not been replaced.',
            chain: chainLocale
          });
        } else if (newLongestChain && blockchain.chainIsValid(newLongestChain)) {
          blockchain.chain = newLongestChain;
          blockchain.transactions = newPendingTransactions!;

          res.send({
            message: 'This chain has been replaced.',
            chain: chainLocale
          });
        }
      } else {
        res.status(500).send({ message: 'Current chain has not been replaced.', networkNodes });
      }
    });
  } else {
    res.send({
      message: 'Current chain has not been replaced. No nodes to sync with available.',
      networkNode: blockchain.networkNode,
      networkNodes
    });
  }
});

router.get('/block/:hash', (req: Request, res: Response): void => {
  const { params }: Record<'params', ParamsDictionary> = req;
  const hash: string = params.hash;
  const block: { block: Block<number> | null; index: number | null; } = blockchain.getBlockByHash(hash);

  res.send({
    note: 'Block:',
    ...block
  });
});

router.get('/transaction/:id', (req: Request, res: Response): void => {
  const note: string = 'Transaction und Block:';
  const { params }: Record<'params', ParamsDictionary> = req;
  const id: string = params.id;
  const transactionData: { transaction: Transaction<number>; position: number; block: Block<number>; } | { transaction: null; position: null; block: null; } = blockchain.getTransaction(id);
  const { transaction }: Record<'transaction', Transaction<number> | null> = transactionData;
  const { block }: Record<'block', Block<number> | null> = transactionData;
  const { position }: Record<'position', number | null> = transactionData;

  res.send({
    note, transaction, position, block
  });
});

router.get('/address/:address', (req: Request, res: Response): void => {
  const { params }: Record<'params', ParamsDictionary> = req;
  const address : string = params.address;
  const addressData: { transactions: readonly Transaction<number>[]; length: number; balance: number; }= blockchain.getAddressData(address);

  res.send({
    note: 'Address:',
    addressData
  });
});

export default router;
