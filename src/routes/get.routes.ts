import { env } from 'process';
import { Router, Request, Response } from 'express';

import { blockchain } from '@app/main';
import Block from '@blockchain/block/block.class';

const apiKey: string  = env.API_KEY!;

const router: Router = Router();

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

/**
 * @swagger
 * /get-transactions:
 *   get:
 *     summary: Gibt die Liste der aktuellen Transaktionen zurück
 *     description: Liefert alle Transaktionen, die noch nicht in einem Block enthalten sind.
 *     tags:
 *       - Blockchain
 *     responses:
 *       200:
 *         description: Erfolgreiches Abrufen der Transaktionsliste.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 length:
 *                   type: integer
 *                   description: Die Anzahl der ausstehenden Transaktionen.
 *                   example: 2
 *                 transactions:
 *                   type: array
 *                   description: Eine Liste der aktuellen Transaktionen.
 *                   items:
 *                     type: object
 *                     description: Eine einzelne Transaktion.
 *                     properties:
 *                       sender:
 *                         type: string
 *                         description: Der Absender der Transaktion.
 *                         example: "Alice"
 *                       receiver:
 *                         type: string
 *                         description: Der Empfänger der Transaktion.
 *                         example: "Bob"
 *                       amount:
 *                         type: number
 *                         description: Der Betrag der Transaktion.
 *                         example: 50
 */
router.get('/get-transactions', (req: Request, res: Response): void => {
  res.send({
    'length': blockchain.transactions.length,
    'transactions': blockchain.transactions,
  });
});

/**
 * @swagger
 * /get-nodes:
 *   get:
 *     summary: Gibt die aktuellen Knoten im Blockchain-Netzwerk zurück
 *     description: Zeigt alle registrierten Knoten an und synchronisiert die Blockchain, falls erforderlich.
 *     tags:
 *       - Blockchain
 *     responses:
 *       200:
 *         description: Erfolgreiches Abrufen der Knoten im Netzwerk.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 length:
 *                   type: integer
 *                   description: Die Anzahl der registrierten Knoten im Netzwerk.
 *                   example: 3
 *                 nodes:
 *                   type: array
 *                   description: Eine Liste der registrierten Knoten (URLs der Knoten).
 *                   items:
 *                     type: string
 *                     example: "http://localhost:3001"
 */
router.get('/get-nodes', (req: Request, res: Response): void => {
  res.send({
    'length': blockchain.nodes.size,
    'nodes': [...blockchain.nodes],
  });
});

/**
 * @swagger
 * /mine-block:
 *   get:
 *     summary: Erstellt einen neuen Block durch Mining
 *     description: Führt den Proof-of-Work-Algorithmus aus, erstellt einen neuen Block und fügt ihn der Blockchain hinzu.
 *     tags:
 *       - Blockchain
 *     responses:
 *       200:
 *         description: Erfolgreiches Mining eines neuen Blocks.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Erfolgsnachricht nach dem Mining.
 *                   example: "Congratulations, you just mined a block!"
 *                 block:
 *                   type: object
 *                   description: Der neu erstellte Block.
 *                   properties:
 *                     timestamp:
 *                       type: integer
 *                       description: Der Zeitstempel, wann der Block erstellt wurde (Unix-Timestamp).
 *                       example: 1672531200000
 *                     index:
 *                       type: integer
 *                       description: Die Position des Blocks in der Blockchain.
 *                       example: 2
 *                     proof:
 *                       type: integer
 *                       description: Der Proof-of-Work-Wert für diesen Block.
 *                       example: 67890
 *                     previousHash:
 *                       type: string
 *                       description: Der Hash des vorherigen Blocks.
 *                       example: "0000abc123..."
 *                     hash:
 *                       type: string
 *                       description: Der Hash dieses Blocks.
 *                       example: "0000def456..."
 *                     transactions:
 *                       type: array
 *                       description: Eine Liste von Transaktionen, die im Block enthalten sind.
 *                       items:
 *                         type: object
 *                         description: Eine einzelne Transaktion.
 *                         properties:
 *                           sender:
 *                             type: string
 *                             description: Der Absender der Transaktion.
 *                             example: "Alice"
 *                           receiver:
 *                             type: string
 *                             description: Der Empfänger der Transaktion.
 *                             example: "Bob"
 *                           amount:
 *                             type: number
 *                             description: Der Betrag der Transaktion.
 *                             example: 50
 *                     coinBase:
 *                       type: object
 *                       description: Eine spezielle Transaktion für Mining-Belohnungen (falls vorhanden).
 *                       nullable: true
 *                       example: { miner: "Miner123", reward: 12.5 }
 *                     data:
 *                       type: string
 *                       description: Zusätzliche Daten, die im Block gespeichert sind.
 *                       example: "Extra information"
 */
router.get('/mine-block', (req: Request, res: Response): void => {
  const previousBlock: Block<number> = blockchain.getPreviousBlock()!;
  const previousProof: number = previousBlock.proof;
  const proof: number = blockchain.proofOfWork(previousProof);
  const previousHash: string = blockchain.hash(previousBlock);
  const block: Block<number> = blockchain.createBlock(proof, previousHash);

  res.send({
    'message': 'Congratulations, you just mined a block!',
    'block': block
  });
});

/**
 * @swagger
 * /replace-chain:
 *   get:
 *     summary: Check and replace the blockchain if necessary.
 *     description: >
 *       This endpoint compares the current blockchain with chains on other nodes.
 *       If a longer chain is found, it replaces the local blockchain to ensure consistency
 *       across the network. If the current chain is already the largest, no changes are made.
 *     tags:
 *       - Blockchain
 *     responses:
 *       200:
 *         description: Successful response with the status of the blockchain replacement.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Status of the blockchain replacement.
 *                   example: "The nodes had different chains ❗"
 *                 chain:
 *                   type: array
 *                   description: The current state of the blockchain.
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                         description: The block index.
 *                       data:
 *                         type: string
 *                         description: The data stored in the block.
 *                   example: [{ index: 1, data: "Genesis Block" }]
 *                 length:
 *                   type: integer
 *                   description: The length of the blockchain.
 *                   example: 5
 *       500:
 *         description: Internal server error. Something went wrong while processing the request.
 */
router.get('/replace-chain', async (req: Request, res: Response): Promise<void> => {
  const isChainReplaced: boolean = await blockchain.replaceChain();

  res.send({
    'message': isChainReplaced ? 'The nodes had different chains ❗' : 'All good, the chain is the largest one ✅',
    'chain': blockchain.chain,
    'length': blockchain.chain.length
  });
});

export default router;
