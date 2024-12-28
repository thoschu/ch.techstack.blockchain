import {Router, Request, Response} from 'express';
import {and, equals, is, isEmpty, length, not, prop, without} from 'ramda';

import {blockchain} from '@app/main';
import {Transaction} from "@blockchain/transaction/transaction.class";
import {Blockchain} from "@blockchain/blockchain.class";

const router: Router = Router();

/**
 * @swagger
 * /connect:
 *   post:
 *     summary: Connect to a list of nodes
 *     description: Accepts a list of nodes, validates their format, and connects them to the blockchain. Returns the updated list of connected nodes and any excluded nodes.
 *     tags:
 *       - Blockchain
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A list of node URLs to connect.
 *             required:
 *               - nodes
 *     responses:
 *       200:
 *         description: Successfully connected nodes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Status message.
 *                 excluded:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of nodes that were already connected or invalid.
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Updated list of connected nodes.
 *                 total:
 *                   type: integer
 *                   description: Total number of connected nodes.
 *       400:
 *         description: Invalid input.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message.
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       node:
 *                         type: string
 *                         description: Node URL that was validated.
 *                       valid:
 *                         type: string
 *                         enum: [⛔, ✅]
 *                         description: Validation result for the node.
 */
router.post('/connect', (req: Request, res: Response): void => {
  const urlRegex: RegExp = /^(https?|http|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})):\/\/([^:/]+)(?::(\d+))?\/?/;
  const { body }: { body: Record<'nodes', string[]> } = req;
  const { nodes }: Record<'nodes', string[]> = body;

  if(isEmpty(nodes)) {
    res.status(400).json({
      error: 'Invalid input! Received a empty list:',
      nodes: '⛔'
    });
  } else if (is(Array<string>, nodes) && nodes.every((item: string) => and<boolean, boolean>(is<StringConstructor>(String, item), urlRegex.test(item)))) {
    const nodesSet: Set<string> = new Set(nodes.map<string>((node: string) => prop<'href', URL>('href', new URL(node))));
    const excluded: string[] = [...prop<'nodes', Blockchain<number>>('nodes', blockchain)].filter((item: string): boolean => nodesSet.has(item));

    nodes.forEach((node: string): void => {
      blockchain.addNode(new URL(node));
    });

    res.json({
      message: `${not(equals<number>(length<string[]>(excluded), length<string[]>(nodes))) ? 'Connected. ' : ''}Received a list of valid nodes${isEmpty(excluded) ? '.' : ' with exceptions.'}`,
      excluded,
      nodes: [...prop<'nodes', Blockchain<number>>('nodes', blockchain)],
      total: prop<'size', Set<string>>('size', prop<'nodes', Blockchain<number>>('nodes', blockchain))
    });
  } else {
    res.status(400).json({
      error: 'Invalid input:',
      nodes: nodes.map<Record<never, string>>((node: string): Record<'node' & 'valid', string> => {
        return {
          node,
          valid: and<boolean, boolean>(is<StringConstructor>(String, node), urlRegex.test(node)) ? '✅' : '⛔',
        }
      })
    });
  }
});

/**
 * @swagger
 * /add-transaction:
 *   post:
 *     summary: Fügt eine neue Transaktion zur Blockchain hinzu
 *     description: Fügt eine Transaktion zur Liste der ausstehenden Transaktionen hinzu und gibt den Index des Blocks zurück, dem die Transaktion hinzugefügt wird.
 *     tags:
 *       - Blockchain
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transaction:
 *                 type: object
 *                 description: Die Transaktion, die hinzugefügt werden soll.
 *                 required:
 *                   - sender
 *                   - receiver
 *                   - amount
 *                 properties:
 *                   sender:
 *                     type: string
 *                     description: Der Absender der Transaktion.
 *                     example: "Alice"
 *                   receiver:
 *                     type: string
 *                     description: Der Empfänger der Transaktion.
 *                     example: "Bob"
 *                   amount:
 *                     type: number
 *                     description: Der Betrag der Transaktion.
 *                     example: 50
 *     responses:
 *       200:
 *         description: Erfolgreiches Hinzufügen der Transaktion.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   type: object
 *                   description: Die hinzugefügte Transaktion.
 *                   properties:
 *                     sender:
 *                       type: string
 *                       description: Der Absender der Transaktion.
 *                       example: "Alice"
 *                     receiver:
 *                       type: string
 *                       description: Der Empfänger der Transaktion.
 *                       example: "Bob"
 *                     amount:
 *                       type: number
 *                       description: Der Betrag der Transaktion.
 *                       example: 50
 *                 block:
 *                   type: integer
 *                   description: Der Index des Blocks, dem die Transaktion hinzugefügt wird.
 *                   example: 5
 */
router.post('/add-transaction', (req: Request, res: Response): void => {
  const transaction: Transaction<number> = req.body.transaction;
  const newTransaction: {
    transaction: Transaction<number>,
    index: number
  } = blockchain.addTransaction(transaction.sender, transaction.receiver, transaction.amount);

  res.send({
    message: 'This transaction will be added to:',
    block: newTransaction.index,
    transaction: newTransaction.transaction,
  });
});

export default router;
