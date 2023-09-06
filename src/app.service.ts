import { randomUUID} from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import {HttpException, Inject, Injectable, Logger, OnModuleDestroy} from '@nestjs/common';
import { Blockchain, CurrentBlockData } from '@/blockchain';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { and, equals, inc, isEmpty, not} from 'ramda';
import {catchError, forkJoin, lastValueFrom, noop, Observable, of, Subscription, tap, using} from 'rxjs';
import { assign, createMachine, interpret, Interpreter, StateMachine } from 'xstate';
import {TransactionData} from "@/transaction/transaction.class";

export enum ResponseStatusRange { ok = 1, warn = 2 , failure = 3 };
export type Identity = Record<'primaryPid' | 'workerPid' | 'worker', number> & Record<'url', URL> & Partial<Record<'uuid', string>>;
export type MineResponse = Record<'note', string> & Record<'block', BlockI>  & Record<'identity', Identity>;
export type MinePayload = { nonce: number, previousBlockHash: string, hash: string };
export type PendingTransactionPayload = Record<'value', unknown> & Record<'sender' | 'recipient', string> & Partial<Record<'data', unknown>>;
export type ChainActionStatusRange = ResponseStatusRange.ok | ResponseStatusRange.warn | ResponseStatusRange.failure;

@Injectable()
export class AppService implements OnModuleDestroy {
  private readonly urlRegExp: RegExp = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?([/?:].*)?$/i;
  private readonly blockchain: Blockchain;
  private readonly logger: Logger = new Logger(AppService.name);
  private readonly blockchainStateMachine;
  private readonly subscriptions: Subscription[] = []
  public readonly nodeUUID: string;
  public readonly blockchainStateMachineService;

  constructor(
      @Inject('IDENTITY') public readonly identity: Identity,
      private readonly httpService: HttpService
  ) {
    this.logger.log(`AppService runs on worker: ${identity.worker} in process ${identity.workerPid} caused by: ${identity.primaryPid} # ${identity.url}`);
    this.blockchain = new Blockchain(this.identity.url);
    this.blockchainStateMachine = createMachine({
      predictableActionArguments: true,
      id: 'blockchains',
      initial: null,
      states: {
        mine: { },
        proofOfWork: { },
        createNewPendingTransaction: { },
        createNewBlockInChain: { },
      }
    });

    // this.blockchainStateMachineService = interpret(this.blockchainStateMachine)
    //     .onTransition((state) => console.log(state.value))
    //     .start();
    // console.log(this.blockchainSingleton.getLastBlock());

    this.nodeUUID = randomUUID();
  }

  onModuleDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription): void => subscription.unsubscribe())
  }

  public getBlockchain(): Blockchain {
    return this.blockchain;
  }

  public getLastBlock(): BlockI {
    return this.blockchain.getLastBlock();
  }

  public createNewTransaction({ value, sender, recipient, data }: PendingTransactionPayload): TransactionI {
    return this.blockchain.createNewTransaction(value, sender, recipient, data);
  }

  public addNewTransactionToPendingTransaction(newTransaction: TransactionI): number {
    return this.blockchain.addNewTransactionToPendingTransaction(newTransaction);
  }

  public broadcastTransactionToNetwork(newTransaction: TransactionI): ChainActionStatusRange {
    const registerNodeObservables: Observable<AxiosResponse>[] = [];
    let returnValue: ChainActionStatusRange = ResponseStatusRange.ok

    this.blockchain.networkNodes.forEach((networkNodeUrl: URL): void => {
      const { href }: { href: string } = this.blockchain.currentNodeUrl;
      const requestOptions: AxiosRequestConfig<URL> = {
        responseType: 'json',
        headers: {
          'x-network-node': href
        }
      };
      const body: TransactionI = newTransaction;
      const postUrl: URL = new URL('/v1/transaction', networkNodeUrl);

      const post$: Observable<AxiosResponse<URL, boolean>> = this.httpService.post(`${postUrl}`, body, requestOptions);

      registerNodeObservables.push(post$);
    });

    const forkJoinSubscription: Subscription = forkJoin<AxiosResponse[]>(registerNodeObservables).subscribe((responses: AxiosResponse<URL>[]): void => {
      responses.forEach((response: AxiosResponse<URL>): void => {
        this.logger.log(`> ${response.config.url} > ${response.status} > ${JSON.stringify(response.data)}`);

        if(response.statusText !== 'ok') {
          returnValue = ResponseStatusRange.warn
        }
      });
    });

    this.subscriptions.push(forkJoinSubscription);

    return returnValue;
  }

  public async mine(): Promise<MineResponse> {
    const transaction: TransactionI = this.blockchain.createNewTransaction(null, '00', this.nodeUUID);

    // this.blockchain.addNewTransactionToPendingTransaction(transaction);

    const networkNodeUrl: URL = this.blockchain.currentNodeUrl;
    const postUrl: URL = new URL('/v1/transaction/broadcast', networkNodeUrl);
    const body: TransactionData = transaction;
    const requestOptions: AxiosRequestConfig<URL> = { responseType: 'json' };

    const post$: Observable<AxiosResponse> = this.httpService.post(`${postUrl}`, body, requestOptions);

    const axiosResponse: AxiosResponse<any, any> = await lastValueFrom(post$);

  // too

    const payload: MinePayload = this.getCreateMineResponsePayload();

    const mineResponse: MineResponse = this.createMineResponse(payload);

    this.broadcastNewBlockToNetwork(mineResponse.block);

    return this.createMineResponse(payload);
  }

  public registerAndBroadcastNode(url: string): ChainActionStatusRange {
    const newNodeUrl: URL = new URL(url);

    // this.subscriptions.push(this.httpService
    //     .head(`${newNodeUrl}`)
    //     .pipe(catchError<AxiosResponse, Observable<boolean>>((error) => {
    //       console.log(error);
    //       console.log('############################');
    //       return of(false);
    //     }))
    //     .subscribe((response: AxiosResponse<any, any>): void => {
    //       // console.log(response);
    //       // this.logger.log(`> ${newNodeUrl} > ${JSON.stringify(response)}`);
    //     }));

    const registerNodeObservables: Observable<AxiosResponse>[] = [];
    const isURLPresentInBlockchainNetworkNodes: boolean = this.blockchain.networkNodes.some((urlObj: URL): boolean => equals<string>(urlObj.href, newNodeUrl.href));
    const blockchainNetworkNodesIncludesNotNewUrl: boolean = not(isURLPresentInBlockchainNetworkNodes);
    const { currentNodeUrl }: { currentNodeUrl: URL } = this.blockchain;
    const newNodeIsCurrentNode: boolean = equals<string>(`${newNodeUrl}`, `${currentNodeUrl}`);
    const newNodeIsNotCurrentNode: boolean = not(newNodeIsCurrentNode);
    let returnValue: ChainActionStatusRange;

    if(newNodeIsCurrentNode) {
      returnValue = ResponseStatusRange.warn;
    } else if(and<boolean, boolean>(blockchainNetworkNodesIncludesNotNewUrl, newNodeIsNotCurrentNode)) {
      this.blockchain.networkNodes.push(newNodeUrl);

      returnValue = ResponseStatusRange.ok;
    } else {
      returnValue = ResponseStatusRange.failure;
    }

    this.blockchain.networkNodes.forEach((networkNodeUrl: URL): void => {
      const requestOptions: AxiosRequestConfig<URL> = { responseType: 'json' };
      const body: Record<'url', URL> = { url: newNodeUrl };
      const postUrlV1RegisterNode: URL = new URL('/v1/register-node', networkNodeUrl);
      const post$: Observable<AxiosResponse<URL, boolean>> = this.httpService.post(`${postUrlV1RegisterNode}`, body, requestOptions);

      registerNodeObservables.push(post$);
    });

    const forkJoinSubscription: Subscription = forkJoin<AxiosResponse[]>(registerNodeObservables).subscribe((responses: AxiosResponse<URL>[]): void => {
      const requestOptions: AxiosRequestConfig<URL> = { responseType: 'json' };
      const data: { allNetworkNodes: URL[] } = { allNetworkNodes: [...this.blockchain.networkNodes, this.blockchain.currentNodeUrl]};

      responses.forEach((response: AxiosResponse<URL>): void => {
        this.logger.log(`> ${response.config.url} > ${response.status} > ${JSON.stringify(response.data)}`);
      });

      const postUrlV1RegisterNodesBulk: URL = new URL('/v1/register-nodes-bulk', newNodeUrl);
      const postSubscription: Subscription = this.httpService
        .post(`${postUrlV1RegisterNodesBulk}`, data, requestOptions)
        .subscribe((response: AxiosResponse): void => {
          this.logger.log(`> ${postUrlV1RegisterNodesBulk} > ${response.status} > ${JSON.stringify(response.data)}`);
        });

      this.subscriptions.push(postSubscription);
      // postSubscription.unsubscribe();
    });

    this.subscriptions.push(forkJoinSubscription);
    // forkJoinSubscription.unsubscribe();

    return returnValue;
  }

  public registerNode(url: string): ChainActionStatusRange {
    const newNodeUrl: URL = new URL(url);
    const currentNodeUrl: URL = this.blockchain.currentNodeUrl;
    const blockchainNetworkNodesIncludesNewUrl: boolean = this.blockchain.networkNodes.includes(newNodeUrl);
    const blockchainNetworkNodesIncludesNotNewUrl: boolean = not(blockchainNetworkNodesIncludesNewUrl);
    const newNodeEqualsCurrentNode: boolean = equals<string>(`${newNodeUrl}`, `${currentNodeUrl}`);
    const newNodeEqualsNotCurrentNode: boolean = not(newNodeEqualsCurrentNode);
    const isValidNodeUrl: boolean = and<boolean, boolean>(blockchainNetworkNodesIncludesNotNewUrl, newNodeEqualsNotCurrentNode)

    if(isValidNodeUrl) {
      this.blockchain.networkNodes.push(newNodeUrl);

      return ResponseStatusRange.ok;
    }

    return ResponseStatusRange.warn;
  }

  public registerNodesBulk(allNetworkNodes: URL[]): ChainActionStatusRange {
    const { networkNodes }: { networkNodes: URL[] } = this.blockchain;
    const isNetworkNodesEmpty: boolean = isEmpty(networkNodes);
    const { href: currentNodeUrlHref }: { href: string } = this.blockchain.currentNodeUrl;

    if(isNetworkNodesEmpty) {
      const filteredAllNetworkNodes: URL[] = allNetworkNodes.filter((urlObj: URL): boolean => not(equals<string>(urlObj.href, currentNodeUrlHref)));

      this.blockchain.networkNodes.push(...filteredAllNetworkNodes);

      return ResponseStatusRange.ok;
    }

    return ResponseStatusRange.failure;
  }

  public isSenderAllowedToSendTransaction(networkNodeSender: string): boolean {
    const { networkNodes }: { networkNodes: Array<URL> } = this.getBlockchain();
    const networkNodesClone: string[] = [...networkNodes].map((nodeUrl: URL): string => nodeUrl.href);

    return networkNodesClone.includes(networkNodeSender);
  }

  private getCreateMineResponsePayload(): MinePayload {
    const lastBlock: BlockI = this.getLastBlock();
    const { index: lastBlockIndex }: { index: number } = lastBlock;
    const index: number = inc(lastBlockIndex);
    const previousBlockHash: string = lastBlock.hash;
    const transactions: TransactionI[] = this.blockchain.pendingTransactions;
    const currentBlockData: CurrentBlockData = { index, transactions };
    const nonce: number = this.blockchain.proofOfWork(previousBlockHash, currentBlockData);
    const hash: string = this.blockchain.calculateHash(previousBlockHash, currentBlockData, nonce);

    return { nonce, previousBlockHash, hash };
  }

  private createMineResponse({ nonce, previousBlockHash, hash }: MinePayload): MineResponse  {
    const block: BlockI =  this.blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);
    const note: string = 'New block mined successfully.';
    const identity: Identity = this.identity;

    return { note, block, identity };
  }

  private broadcastNewBlockToNetwork(block: BlockI): void | HttpException {
    const registerNodeObservables: Observable<AxiosResponse>[] = [];

    const { href }: { href: string } = this.blockchain.currentNodeUrl;
    const requestOptions: AxiosRequestConfig<URL> = {
      responseType: 'json',
      headers: {
        'x-network-node': href
      }
    };
    this.blockchain.networkNodes.forEach((networkNodeUrl: URL): void => {
      const postUrlV1ReceiveNewBlock: URL = new URL('/v1/receive-new-block', networkNodeUrl);

      const post$: Observable<AxiosResponse<URL, boolean>> = this.httpService.post(`${postUrlV1ReceiveNewBlock}`, block, requestOptions);

      registerNodeObservables.push(post$);
    });

    forkJoin<AxiosResponse[]>(registerNodeObservables).subscribe((responses: AxiosResponse<URL>[]): void => {
      responses.forEach((response: AxiosResponse<URL>): void => {
        this.logger.log(`> ${response.config.url} > ${response.status} > ${JSON.stringify(response.data)}`);
      });
    });
  }
}
