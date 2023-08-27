import { randomUUID} from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Blockchain, CurrentBlockData } from '@/blockchain';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import {and, equals, inc, not} from 'ramda';
import { forkJoin, noop, Observable, Subscription, tap } from 'rxjs';
import { assign, createMachine, interpret, Interpreter, StateMachine } from 'xstate';

export type Identity = Record<'primaryPid' | 'workerPid' | 'worker', number> & Record<'url', URL> & Partial<Record<'uuid', string>>;
export type MineResponse = Record<'note', string> & Record<'block', BlockI>  & Record<'identity', Identity>;
export type MinePayload = { nonce: number, previousBlockHash: string, hash: string };
export type PendingTransactionPayload = Record<'value', unknown> & Record<'sender' | 'recipient', string> & Partial<Record<'data', unknown>>;

@Injectable()
export class AppService implements OnModuleDestroy {
  private readonly blockchain: Blockchain;
  private readonly logger: Logger = new Logger(AppService.name);
  private readonly blockchainStateMachine;
  private readonly subscriptions: Subscription[] = []
  public readonly nodeUUID: string;
  public readonly blockchainStateMachineService;

  constructor(
      @Inject('IDENTITY') private readonly identity: Identity,
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

  public registerAndBroadcastNode(url: URL): boolean {
    const registerNodeObservables: Observable<AxiosResponse>[] = [];
    const isURLPresentInBlockchainNetworkNodes: boolean = this.blockchain.networkNodes.some((urlObj: URL): boolean => urlObj.href === url.href);
    const blockchainNetworkNodesIncludesNotNewUrl: boolean = not(isURLPresentInBlockchainNetworkNodes);
    console.log(this.blockchain);
    console.log(blockchainNetworkNodesIncludesNotNewUrl);
    const currentNodeUrl: URL = this.blockchain.currentNodeUrl;
    const newNodeIsCurrentNode: boolean = equals<string>(`${url}`, `${currentNodeUrl}`);
    const newNodeIsNotCurrentNode: boolean = not(newNodeIsCurrentNode);
    let returnValue: boolean = false;

    if(and<boolean, boolean>(blockchainNetworkNodesIncludesNotNewUrl, newNodeIsNotCurrentNode)) {
      this.blockchain.networkNodes.push(url);

      returnValue = true;
    }

    this.blockchain.networkNodes.forEach((networkNodeUrl: URL): void => {
      const requestOptions: AxiosRequestConfig<URL> = { responseType: 'json' };
      const body: Record<'url', URL> = { url: networkNodeUrl };
      const postUrl: URL = new URL(networkNodeUrl);

      postUrl.pathname = '/v1/register-node';

      const post$: Observable<AxiosResponse<URL, unknown>> = this.httpService.post(`${postUrl}`, body, requestOptions);

      registerNodeObservables.push(post$);
    });

    const forkJoinSubscription: Subscription = forkJoin<AxiosResponse[]>(registerNodeObservables).subscribe((responses: AxiosResponse<URL>[]): void => {
      responses.forEach((response: AxiosResponse<URL>): void => {
        console.log(response.data);
      });
      const requestOptions: AxiosRequestConfig<URL> = {
        responseType: 'json'
      };

      const data: { allNetworkNode: URL[] } = { allNetworkNode: [...this.blockchain.networkNodes, this.blockchain.currentNodeUrl]};

      this.httpService
          .post(`${url}v1/register-nodes-bulk`, data, requestOptions)
          .subscribe((response: AxiosResponse): void => {
            console.log(response.data);
          });
    });

    this.subscriptions.push(forkJoinSubscription);

    return returnValue;
  }

  public registerNode(url: URL): boolean {
    const currentNodeUrl: URL = this.blockchain.currentNodeUrl;
    const blockchainNetworkNodesIncludesNotNewUrl: boolean = not(this.blockchain.networkNodes.includes(url));
    const newNodeIsNotCurrentNode: boolean = not(equals<string>(`${url}`, `${currentNodeUrl}`));

    if(and<boolean, boolean>(blockchainNetworkNodesIncludesNotNewUrl, newNodeIsNotCurrentNode)) {
      this.blockchain.networkNodes.push(url);

      return true
    }

    return false
  }

  private broadcastNode(url: URL): void {

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
