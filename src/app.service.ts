import { randomUUID} from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import {HttpException, Inject, Injectable, Logger, OnModuleDestroy} from '@nestjs/common';
import { Blockchain, CurrentBlockData } from '@/blockchain';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { and, equals, inc, isEmpty, not} from 'ramda';
import {forkJoin, noop, Observable, Subscription, tap, using} from 'rxjs';
import { assign, createMachine, interpret, Interpreter, StateMachine } from 'xstate';

export enum ResponseStatusRange { ok = 1, warn = 2 , failure = 3 };
export type Identity = Record<'primaryPid' | 'workerPid' | 'worker', number> & Record<'url', URL> & Partial<Record<'uuid', string>>;
export type MineResponse = Record<'note', string> & Record<'block', BlockI>  & Record<'identity', Identity>;
export type MinePayload = { nonce: number, previousBlockHash: string, hash: string };
export type PendingTransactionPayload = Record<'value', unknown> & Record<'sender' | 'recipient', string> & Partial<Record<'data', unknown>>;
export type ChainActionStatusRange = ResponseStatusRange.ok | ResponseStatusRange.warn | ResponseStatusRange.failure;

@Injectable()
export class AppService implements OnModuleDestroy {
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

  public createNewPendingTransaction({ value, sender, recipient, data }: PendingTransactionPayload): number {
    return this.blockchain.createNewPendingTransaction(value, sender, recipient, data);
  }

  public getLastBlock(): BlockI {
    return this.blockchain.getLastBlock()
  }

  public mine(): MineResponse {
    this.blockchain.createNewPendingTransaction(null, '00', this.nodeUUID);

    const payload: MinePayload = this.getCreateMineResponsePayload();

    return this.createMineResponse(payload);
  }

  public registerAndBroadcastNode(url: string): ChainActionStatusRange {
    // toDo: test the url (if reachable with head request)
    const newNodeUrl: URL = new URL(url);
    const registerNodeObservables: Observable<AxiosResponse>[] = [];
    const isURLPresentInBlockchainNetworkNodes: boolean = this.blockchain.networkNodes.some((urlObj: URL): boolean => urlObj.href === newNodeUrl.href);
    const blockchainNetworkNodesIncludesNotNewUrl: boolean = not(isURLPresentInBlockchainNetworkNodes);
    const currentNodeUrl: URL = this.blockchain.currentNodeUrl;
    const newNodeIsCurrentNode: boolean = equals<string>(`${newNodeUrl}`, `${currentNodeUrl}`);
    const newNodeIsNotCurrentNode: boolean = not(newNodeIsCurrentNode);
    const isUrlEqualToCurrentNodeUrl: boolean = equals<string>(`${newNodeUrl}`, `${this.blockchain.currentNodeUrl}`);
    let returnValue: ChainActionStatusRange;

    if(isUrlEqualToCurrentNodeUrl) {
      returnValue = ResponseStatusRange.warn;
    } else if(and<boolean, boolean>(blockchainNetworkNodesIncludesNotNewUrl, newNodeIsNotCurrentNode)) {
      this.blockchain.networkNodes.push(newNodeUrl);

      returnValue = ResponseStatusRange.ok;
    } else {
      returnValue = ResponseStatusRange.failure;
    }

    this.blockchain.networkNodes.forEach((networkNodeUrl: URL): void => {
      const requestOptions: AxiosRequestConfig<URL> = { responseType: 'json' };
      const newNodeUrl: URL = new URL(url);
      const body: Record<'url', URL> = { url: newNodeUrl };
      const postUrl: URL = new URL(networkNodeUrl);
      postUrl.pathname = '/v1/register-node';

      const post$: Observable<AxiosResponse<URL, boolean>> = this.httpService.post(`${postUrl}`, body, requestOptions);

      registerNodeObservables.push(post$);
    });

    const forkJoinSubscription: Subscription = forkJoin<AxiosResponse[]>(registerNodeObservables).subscribe((responses: AxiosResponse<URL>[]): void => {
      const requestOptions: AxiosRequestConfig<URL> = { responseType: 'json' };
      const data: { allNetworkNodes: URL[] } = { allNetworkNodes: [...this.blockchain.networkNodes, this.blockchain.currentNodeUrl]};

      responses.forEach((response: AxiosResponse<URL>): void => {
        this.logger.log(`> ${response.config.url} > ${response.status} > ${JSON.stringify(response.data)}`);
      });

      const postSubscription: Subscription = this.httpService
        .post(`${newNodeUrl}v1/register-nodes-bulk`, data, requestOptions)
        .subscribe((response: AxiosResponse): void => {
          this.logger.log(`> ${newNodeUrl}v1/register-nodes-bulk > ${response.status} > ${JSON.stringify(response.data)}`);
        });

      this.subscriptions.push(postSubscription);
    });

    this.subscriptions.push(forkJoinSubscription);

    return returnValue;
  }

  public registerNode(url: string): ChainActionStatusRange {
    const newNodeUrl: URL = new URL(url);
    const currentNodeUrl: URL = this.blockchain.currentNodeUrl;
    const blockchainNetworkNodesIncludesNotNewUrl: boolean = not(this.blockchain.networkNodes.includes(newNodeUrl));
    const newNodeIsNotCurrentNode: boolean = not(equals<string>(`${newNodeUrl}`, `${currentNodeUrl}`));

    if(and<boolean, boolean>(blockchainNetworkNodesIncludesNotNewUrl, newNodeIsNotCurrentNode)) {
      this.blockchain.networkNodes.push(newNodeUrl);

      return ResponseStatusRange.ok;
    }

    return ResponseStatusRange.warn;
  }

  public registerNodesBulk(allNetworkNodes: URL[]): ChainActionStatusRange {
    const isNetworkNodesEmpty: boolean = isEmpty(this.blockchain.networkNodes);

    if(isNetworkNodesEmpty) {
      allNetworkNodes = allNetworkNodes.filter((urlObj: URL): boolean => urlObj.href !== this.blockchain.currentNodeUrl.href);

      this.blockchain.networkNodes.push(...allNetworkNodes);

      return ResponseStatusRange.ok;
    }

    return ResponseStatusRange.failure;
  }


  private getCreateMineResponsePayload(): MinePayload {
    const lastBlock: BlockI = this.getLastBlock();
    const { index }: { index: number } = lastBlock;
    const previousBlockHash: string = lastBlock.hash;
    const transactions: TransactionI[] = this.blockchain.pendingTransactions
    const currentBlockData: CurrentBlockData = { index: inc(index), transactions };
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
}
