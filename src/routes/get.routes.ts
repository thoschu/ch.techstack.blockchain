import { env } from 'process';
import { Router, Request, Response } from 'express';

import { blockchain } from '@app/main';
import Block from '@blockchain/block/block.class';

const router: Router = Router();


const apiKey: string  = env.API_KEY!;

router.get('/info', async (req: Request, res: Response) => {
  const headers = {
    Accept: 'application/json',
    'X-API-Token': apiKey
  };

  const promRes: unknown = await fetch('https://api.blockchain.com/v3/exchange/l2/BTC-USD',{
    method: 'GET',
    headers
  })
    .then(async (res) => {
      return res.json();
    });

  res.send(promRes);
});

/**
 * @swagger
 * /is-valid:
 *   get:
 *     summary: Überprüft die Gültigkeit der Blockchain
 *     description: Prüft, ob die Blockchain gültig ist und gibt die Anzahl der Blöcke zurück.
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
  const isValid: boolean = blockchain.isChainValid(blockchain.chain);

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

router.get('/mine-block', (req: Request, res: Response): void => {
  const previousBlock: Block<number> = blockchain.getPreviousBlock()!;
  const previousProof: number = previousBlock.proof;
  const proof: number = blockchain.proofOfWork(previousProof);
  const previousHash: string = blockchain.hash(previousBlock);
  const block: Block<number> = blockchain.createBlock(proof, previousHash);

  res.send({
    'message': 'Congratulations, you just mined a block!',
    'index': block.index,
    'timestamp': block.timestamp,
    'proof': block.proof,
    'previousHash': block.previousHash
  });
});

export default router;
