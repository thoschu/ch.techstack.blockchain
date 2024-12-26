import {Router, Request, Response} from 'express';
import {and, is, isEmpty, isNil, prop} from 'ramda';

import {blockchain} from '@app/main';
import {Transaction} from "@blockchain/transaction/transaction.class";
import {Blockchain} from "@blockchain/blockchain.class";

const router: Router = Router();

router.post('/connect', (req: Request, res: Response): void => {
  const urlRegex: RegExp = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
  const { nodes }: { nodes: string[] } = req.body;

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
      message: 'Received a list of valid nodes',
      processed: nodes,
      excluded,
      nodes: [...prop<'nodes', Blockchain<number>>('nodes', blockchain)],
      total: prop<'size', Set<string>>('size', prop<'nodes', Blockchain<number>>('nodes', blockchain))
    });
  } else {
    res.status(400).json({
      error: 'Invalid input:',
      nodes: nodes.map((node: string): Record<'node' & 'valid', string> => {
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
    transaction: newTransaction.transaction,
    block: newTransaction.index,
  });
});

export default router;
