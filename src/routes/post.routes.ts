import { Router, Request, Response } from 'express';

import { blockchain } from '@app/main';
import { Transaction } from "@blockchain/transaction/transaction.class";

const router: Router = Router();

router.post('/add-transaction',  (req: Request, res: Response): void => {
  const transaction: Transaction<number> = req.body.transaction;
  const newTransaction: { transaction: Transaction<number>, index: number } = blockchain.addTransaction(transaction.sender, transaction.receiver, transaction.amount);

  res.send({
    transaction:  newTransaction.transaction,
    block: newTransaction.index,
  });
});

export default router;
