import { ECDH, randomBytes, createECDH, createHash } from 'crypto';
import { env } from 'process';
import bs58 from 'bs58';
import { Router, Request, Response } from 'express';
import { forkJoin, from, Observable } from 'rxjs';
import {all, equals, length, inc, prop, reduce, and, gt} from 'ramda';
import axios, { AxiosResponse } from 'axios';

import { blockchain } from '@app/main';
import Block from '@blockchain/block/block.class';
import { Transaction } from '@blockchain/transaction/transaction.class';
import { Blockchain, BlockData } from '@blockchain/blockchain.class';


const apiKey: string  = env.API_KEY!;

const router: Router = Router();

/**
 * @swagger
 * /info:
 *   get:
 *     summary: Fetch blockchain tickers information
 *     description: Retrieves data from the Blockchain.com exchange tickers API.
 *     tags:
 *       - Blockchain
 *     responses:
 *       200:
 *         description: A list of blockchain tickers with their latest information.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   symbol:
 *                     type: string
 *                     description: The trading pair symbol (e.g., ALGO-BTC).
 *                   price_24h:
 *                     type: number
 *                     description: The price of the trading pair in the last 24 hours.
 *                   volume_24h:
 *                     type: number
 *                     description: The volume of trades in the last 24 hours.
 *                   last_trade_price:
 *                     type: number
 *                     description: The price of the most recent trade.
 *       500:
 *         description: Server error while fetching data from the external API.
 */
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

/**
 * @swagger
 * /get-blockchain:
 *   get:
 *     summary: Get the current blockchain state
 *     description: Returns the current blockchain including its chain and pending transactions.
 *     tags:
 *       - Blockchain
 *     responses:
 *       200:
 *         description: Successfully retrieved the blockchain.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blockchain:
 *                   type: object
 *                   properties:
 *                     chain:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             description: A block in the blockchain.
 *                         length:
 *                           type: integer
 *                           description: Total number of blocks in the chain.
 *                     transactions:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             description: A pending transaction in the blockchain.
 *                         length:
 *                           type: integer
 *                           description: Total number of pending transactions.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @swagger
 * /is-valid:
 *   get:
 *     summary: Überprüft die Gültigkeit der Blockchain
 *     description: Prüft, ob die Blockchain gültig ist und gibt die Anzahl der Blöcke zurück.
 *     tags:
 *       - Blockchain
 *     responses:
 *       200:
 *         description: Ergebnis der Blockchain-Validitätsprüfung.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Status der Blockchain-Validität.
 *                   example: The blockchain is valid! ✅
 *                 length:
 *                   type: integer
 *                   description: Die Anzahl der Blöcke in der Blockchain.
 *                   example: 5
 */
router.get('/is-valid', (req: Request, res: Response): void => {
  const isValid: boolean = blockchain.chainIsValid(blockchain.chain);

  res.send({
    'message': isValid ? 'The blockchain is valid! ✅' : 'The blockchain is not valid! ❌',
    'length': blockchain.chain.length
  });
});

/**
 * @swagger
 * /get-chain:
 *   get:
 *     summary: Gibt die gesamte Blockchain zurück
 *     description: Liefert die aktuelle Blockchain und die Anzahl der Blöcke.
 *     tags:
 *       - Blockchain
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe der Blockchain-Daten.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 length:
 *                   type: integer
 *                   description: Die Anzahl der Blöcke in der Blockchain.
 *                   example: 5
 *                 chain:
 *                   type: array
 *                   description: Die vollständige Blockchain.
 *                   items:
 *                     type: object
 *                     description: Ein einzelner Block in der Blockchain.
 *                     properties:
 *                       timestamp:
 *                         type: integer
 *                         description: Der Zeitstempel, wann der Block erstellt wurde (Unix-Timestamp).
 *                         example: 1672531200000
 *                       index:
 *                         type: integer
 *                         description: Die Position des Blocks in der Blockchain.
 *                         example: 1
 *                       proof:
 *                         type: integer
 *                         description: Der Proof-of-Work-Wert für diesen Block.
 *                         example: 12345
 *                       previousHash:
 *                         type: string
 *                         description: Der Hash des vorherigen Blocks.
 *                         example: "0000abc123..."
 *                       hash:
 *                         type: string
 *                         description: Der Hash dieses Blocks.
 *                         example: "0000def456..."
 *                       transactions:
 *                         type: array
 *                         description: Eine Liste von Transaktionen, die im Block enthalten sind.
 *                         items:
 *                           type: object
 *                           description: Eine einzelne Transaktion.
 *                           properties:
 *                             sender:
 *                               type: string
 *                               description: Der Absender der Transaktion.
 *                               example: "Alice"
 *                             receiver:
 *                               type: string
 *                               description: Der Empfänger der Transaktion.
 *                               example: "Bob"
 *                             amount:
 *                               type: number
 *                               description: Der Betrag der Transaktion.
 *                               example: 50
 *                       coinBase:
 *                         type: object
 *                         description: Eine spezielle Transaktion für Mining-Belohnungen (falls vorhanden).
 *                         nullable: true
 *                         example: { miner: "Miner123", reward: 12.5 }
 *                       data:
 *                         type: string
 *                         description: Zusätzliche Daten, die im Block gespeichert sind.
 *                         example: "Extra information"
 */
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
  const nodes: string[] = [...blockchain.networkNodes];
  const axiosObservableList: Observable<AxiosResponse>[] = [];
  const axiosObservable$: Observable<AxiosResponse[]> = forkJoin<AxiosResponse[]>(axiosObservableList);

  for (const networkNode of nodes) {
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

      console.log('###################');

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
          message: 'Current chain has not been replaced',
          chain: chainLocale
        });
      } else if (newLongestChain && blockchain.chainIsValid(newLongestChain)) {
        blockchain.chain = newLongestChain;
        blockchain.transactions = newPendingTransactions!;

        res.send({
          message: 'This chain has been replaced',
          chain: chainLocale
        });
      }
    } else {
      res.status(500).send({ '#': 'NOPE', nodes });
    }
  });
});

export default router;
