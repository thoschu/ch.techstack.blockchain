import { Router, Request, Response } from 'express';
import { all, and, equals, is, isEmpty, length, not, prop } from 'ramda';
import axios, { AxiosResponse } from 'axios';
import { forkJoin, from, Observable, Subscription } from 'rxjs';

import { blockchain } from '@app/main';
import { Transaction } from '@blockchain/transaction/transaction.class';
import { AddTransactionReturn, Blockchain } from '@blockchain/blockchain.class';

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

router.post('/add-transaction', (req: Request, res: Response): void => {
  const transaction: Transaction<number> = req.body.transaction;
  const newTransaction: AddTransactionReturn<number> = blockchain.addTransaction(transaction.sender, transaction.receiver, transaction.amount);

  res.send({
    message: 'This transaction will be added to:',
    block: newTransaction.index,
    transaction: newTransaction.transaction,
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
      const axiosPromise: Promise<AxiosResponse<{ message: string; node: string; }, Record<'node', string> >> = axios.post(`${networkNode}api/v3/register-node`, data);

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
                nodeAddress: Blockchain.nodeAddress
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
      nodeAddress: Blockchain.nodeAddress
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

export default router;
