import { Router, Request, Response } from 'express';
import { all, and, equals, inc, is, isEmpty, length, not, prop } from 'ramda';
import axios, { AxiosResponse } from 'axios';
import { forkJoin, from, Observable } from 'rxjs';

import { blockchain } from '@app/main';
import { Transaction } from '@blockchain/transaction/transaction.class';
import { AddTransactionReturn, Blockchain } from '@blockchain/blockchain.class';
import Block from "@blockchain/block/block.class";

const router: Router = Router();

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
    const excluded: string[] = [...prop<'networkNodes', Blockchain<number>>('networkNodes', blockchain)].filter((item: string): boolean => nodesSet.has(item));

    nodes.forEach((node: string): void => {
      blockchain.addNode(new URL(node));
    });

    res.json({
      message: `${not(equals<number>(length<string[]>(excluded), length<string[]>(nodes))) ? 'Connected. ' : ''}Received a list of valid nodes${isEmpty(excluded) ? '.' : ' with exceptions.'}`,
      excluded,
      nodes: [...prop<'networkNodes', Blockchain<number>>('networkNodes', blockchain)],
      total: prop<'size', Set<string>>('size', prop<'networkNodes', Blockchain<number>>('networkNodes', blockchain))
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

router.post('/transaction', (req: Request, res: Response): void => {
  const { body }: { body: Record<'transaction', Transaction<number>> } = req;
  const { transaction: tx }: Record<'transaction', Transaction<number>> = body;
  const addTxReturn: AddTransactionReturn<number> = blockchain.addNewTransaction(tx);
  const message: string = 'Transaction will be added to block:';
  const { index, transaction, position }: Record<'index', number> & Record<'transaction', Transaction<number>> & Record<'position', number> = addTxReturn;

  res.send({ message, index, transaction, position });
});

router.post('/transaction/broadcast', (req: Request, response: Response): void => {
  const { body }: { body: Record<'transaction', Transaction<number>> } = req;
  const { transaction }: Record<'transaction', Transaction<number>> = body;
  const newTransaction: Transaction<number> = blockchain.createTransaction(transaction.sender, transaction.receiver, transaction.amount);
  const addNewTransactionReturn: AddTransactionReturn<number> = blockchain.addNewTransaction(newTransaction);
  const axiosObservableList: Observable<AxiosResponse<{message: string; transaction: Transaction<number>}>>[] = [];
  const axiosObservable$: Observable<AxiosResponse<{ message: string; transaction: Transaction<number> }, Record<'transaction', Transaction<number>>>[]> =
    forkJoin<AxiosResponse<{ message: string; transaction: Transaction<number> }, Record<'transaction', Transaction<number>>>[]>(axiosObservableList);

  blockchain.networkNodes.forEach(async (node: string): Promise<void> => {
    const { transaction }: { transaction: Transaction<number> } = addNewTransactionReturn;
    const data: Record<'transaction', Transaction<number>> = { transaction };
    const axiosPromise: Promise<AxiosResponse> =
      axios.post<Record<'transaction', Transaction<number>>, AxiosResponse<{message: string; index: number; position: number; transaction: Transaction<number>}>>(`${node}api/v3/transaction`, data);

    axiosObservableList.push(from<Promise<AxiosResponse<{message: string; index: number; position: number; transaction: Transaction<number>}>>>(axiosPromise));
  });

  axiosObservable$.subscribe((res: AxiosResponse<{ message: string; transaction: Transaction<number> }, Record<'transaction', Transaction<number>>>[]): void => {
    const responseMapStatus: number[] = res.map<number>((value: AxiosResponse): number => value.status);
    const responseMapData: Transaction<number>[] = res.map((value: AxiosResponse) => value.data.transaction);
    const httpStatusCodeOk: number = 200;
    const equals200: (eq: number) => boolean = equals<number>(httpStatusCodeOk);
    const equalsTransaction: (b: Transaction<number>) => boolean = equals<Transaction<number>>(newTransaction);
    const isResponseMapStatusAllEquals200: boolean = all<number>(equals200)(responseMapStatus);
    const isResponseMapDataAllEqualsTransaction: boolean = all<Transaction<number>>(equalsTransaction)(responseMapData);
    const isRegisterNodePostValid: boolean = and<boolean, boolean>(isResponseMapStatusAllEquals200, isResponseMapDataAllEqualsTransaction);
    const { index }: Record<'index', number> = addNewTransactionReturn;
    const { transaction }: Record<'transaction', Transaction<number>> = addNewTransactionReturn;
    const { position }: Record<'position', number> = addNewTransactionReturn;
    let responseUpdate: Response, message: string;

    if(isRegisterNodePostValid) {
      responseUpdate = response.status(201);
      message = 'Transaction created and broadcast successfully.';
    } else {
      responseUpdate = response.status(500);
      message = 'A failure occurred:';
    }

    responseUpdate.send({
      message,
      index,
      transaction,
      position
    });
  });
});

router.post('/register-broadcast-node', async (req: Request, res: Response): Promise<void> => {
  const urlRegex: RegExp = /^(https?|http|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})):\/\/([^:/]+)(?::(\d+))?\/?/;
  const { body }: { body: Record<'node', string> } = req;
  const { node }: Record<'node', string> = body;
  const url: URL = new URL(node);
  const { href }: Record<'href', string> = new URL(url);
  const { networkNode }: { networkNode: string } = blockchain;
  const newNodeIsNotNetworkNode: boolean = not(equals<string>(href, networkNode));
  const isValidUrl: boolean = urlRegex.test(node);
  const newNodeIsValid: boolean = and<boolean, boolean>(isValidUrl, newNodeIsNotNetworkNode);
  let isNewNodeValidAndAvailable: boolean;

  try {
    const axiosHeadResponse: AxiosResponse = await axios.head(`${href}`);
    const isNewNodeAvailable: boolean = equals<number>(axiosHeadResponse.status, 200);

    isNewNodeValidAndAvailable = and<boolean, boolean>(newNodeIsValid, isNewNodeAvailable);
  } catch (error) {
    isNewNodeValidAndAvailable = false;
  }

  if (isNewNodeValidAndAvailable) {
    const axiosObservableList: Observable<AxiosResponse<{ message: string; node: string }, Record<'node', string>>>[] = [];
    const nodes: Set<string> = blockchain.addNode(url);
    const axiosObservable$: Observable<AxiosResponse<{ message: string; node: string }, Record<'node', string>>[]> = forkJoin(axiosObservableList);

    for (const networkNode of nodes) {
      const data: Record<'node', string> = { node: href };
      const axiosPromise: Promise<AxiosResponse<{ message: string; node: string; }, Record<'node', string> >> =
        axios.post(`${networkNode}api/v3/register-node`, data);

      axiosObservableList.push(from<Promise<AxiosResponse<{ message: string; node: string; }, Record<'node', string>>>>(axiosPromise));
    }

    axiosObservable$.subscribe({
      next: (response: AxiosResponse<{ message: string; node: string }, Record<'node', string>>[]): void => {
        const responseMap: number[] = response.map<number>((value: AxiosResponse): number => value.status);
        const httpStatusCodeOk: number = 200;
        const equals200: (eq: number) => boolean = equals<number>(httpStatusCodeOk);
        const isRegisterNodePostValid: boolean = all<number>(equals200)(responseMap);

        if(isRegisterNodePostValid) {
          const bulk$: Observable<AxiosResponse> = from<Promise<AxiosResponse>>(axios.post(`${href}api/v3/register-nodes-bulk`, {
            nodes: [...nodes, blockchain.networkNode]
          }));

          bulk$.subscribe({
            next: (axiosResponse: AxiosResponse): void => {
              const { data }: { data: { message: string; node: string; } } = axiosResponse;
              const { node: responseNode }: { message: string; node: string; } = data;

              res.send({
                message: `New node registered with network successfully.: ${responseNode}`,
                networkNodes: [...nodes],
                nodeAddress: blockchain.networkNode
              });
            }
          })
        }
      },
      error: (err: Error) => console.error(err)
    });
  } else {
    res.status(422).send({
      message: `Node registration ${node} with the network failed.`,
      node,
      networkNodes: [...blockchain.networkNodes],
      networkNode: blockchain.networkNode
    });
  }
});

router.post('/register-node', (req: Request, res: Response): void => {
  const { body }: { body: Record<'node', string> } = req;
  const { node }: Record<'node', string> = body;
  const { networkNode }: Record<'networkNode', string> = blockchain;
  const notCurrentNode: boolean = not(equals<string>(node, networkNode));

  if(notCurrentNode) {
    blockchain.addNode(new URL(node));
  }

  res.send({
    message: `New node: ${node} registered successfully with node.`,
    node: networkNode,
    nodes: [...blockchain.networkNodes]
  });
});

router.post('/register-nodes-bulk', (req: Request, res: Response): void => {
  const { body }: { body: Record<'nodes', ReadonlyArray<string>> } = req;
  const { nodes }: Record<'nodes', ReadonlyArray<string>> = body;
  const { networkNode }: Record<'networkNode', string> = blockchain;

  nodes.forEach((node: string): void => {
    if(not(equals<string>(node, networkNode))) {
      blockchain.addNode(new URL(node));
    }
  });

  res.send({
    message: 'Bulk registration successful.',
    node: networkNode
  });
});

router.post('/receive-new-block', (req: Request, res: Response): void => {
  const { body }: { body: Record<'block', Block<number>> } = req;
  const { block }: Record<'block', Block<number>> = body;
  const lastBlock: Block<number> = blockchain.getPreviousBlock();
  const lastBlockHash: string = lastBlock.hash;
  const previousBlockHash: string = block.previousHash;
  const correctHash: boolean = equals<string>(lastBlockHash, previousBlockHash);
  const { index: blockIndex }: Record<'index', number> = block;
  const { index: lastBlockIndex }: Record<'index', number> = lastBlock;
  const lastBlockIndexInc: number = inc(lastBlockIndex);
  const correctIndex: boolean = equals<number>(lastBlockIndexInc, blockIndex);
  const { networkNode }: { networkNode: string } = blockchain;

  if(and<boolean, boolean>(correctHash, correctIndex)) {
    const index: number = blockchain.chain.push(block);

    blockchain.transactions.length = 0;

    res.send({
      message: 'New block received and accepted.',
      block, index, networkNode
    });
  } else {
    res.status(500).send({
      message: 'New block rejected.',
      block, networkNode
    });
  }
});

export default router;
