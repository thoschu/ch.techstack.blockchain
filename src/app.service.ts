import {
  createSign,
  createVerify,
  generateKeyPairSync,
  KeyPairSyncResult,
  randomUUID,
  RSAKeyPairOptions,
  Sign,
  Verify,
} from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { Blockchain, CurrentBlockData } from '@/blockchain';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import {and, compose, equals, inc, includes, isEmpty, isNil, not, prop} from 'ramda';
import {find, forkJoin, map, Observable, Subscriber, Subscription} from 'rxjs';
import { createMachine } from 'xstate';
import cjsExport from "@typescript-eslint/eslint-plugin";

export enum ResponseStatusRange {
  ok = 1,
  warn = 2,
  failure = 3,
};
export type Identity = Record<'primaryPid' | 'workerPid' | 'worker', number> & Record<'url', URL> & Partial<Record<'uuid', string>>;
export type MineResponse = Record<'note', string> & Record<'block', BlockI>  & Record<'identity', Identity>;
export type MinePayload = { nonce: number, previousBlockHash: string, hash: string };
export type PendingTransactionPayload = Record<'value', unknown> & Record<'sender' | 'recipient', string> & Partial<Record<'data', unknown>>;
export type ChainActionStatusRange = ResponseStatusRange.ok | ResponseStatusRange.warn | ResponseStatusRange.failure;
export type BlockSignature = Record<'publicKey', string> & Record<'signature', string>;

export enum RoutesEnum {
  blockchain = '/blockchain',
  mine = '/mine',
  receiveNewBlock = '/receive-new-block',
  transaction = '/transaction',
  transactionBroadcast = '/transaction/broadcast',
  registerBroadcastNode = '/register-broadcast-node',
  registerNode = '/register-node',
  registerNodesBulk = '/register-nodes-bulk'
}

@Injectable()
export class AppService implements OnModuleDestroy {
  private readonly generateKeyPairSyncOptions: RSAKeyPairOptions<'pem', 'pem'> = {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    }
  };
  private keys: KeyPairSyncResult<string, string> = generateKeyPairSync('rsa', this.generateKeyPairSyncOptions);
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

    // ToDo: for smart contracts
    // this.blockchainStateMachineService = interpret(this.blockchainStateMachine)
    //     .onTransition((state) => console.log(state.value))
    //     .start();
    // console.log(this.blockchainSingleton.getLastBlock());

    this.nodeUUID = randomUUID();
  }

  onModuleDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription): void => subscription.unsubscribe())
  }

  public getAddressdata(): any {

  }

  public getTransactionById2(transactionId: string): any {
    const chain: BlockI[] = this.blockchain.chain;

    let result = null;

    chain.some((block: BlockI): boolean => {
      return block.transactions.some((transaction: TransactionI): boolean => {
        if(transaction.id === transactionId) {
          result = { transaction, block };

          return true; // Abbruch, da das Element gefunden wurde
        }

        return false;
      });
    });

    return result;
  }

  public getTransactionById(transactionId: string): { transactionIndex: number, block: BlockI } | null {
    const chain: BlockI[] = this.blockchain.chain;
    let transactionIndex: number = null;
    let block: BlockI = null;

    chain.forEach((correctBlock: BlockI): void => {
      correctBlock.transactions.forEach((transaction: TransactionI, idx: number): void => {
        if(transaction.id === transactionId) {
          transactionIndex = idx;
          block = correctBlock;
        }
      });
    });

   return transactionIndex && block ? { transactionIndex, block } : null;
  }

  public getBlockByBlockHash(blockHash: string): BlockI | null {
    const chain: BlockI[] = this.blockchain.chain;

    return chain.find(
      (block: BlockI): boolean => prop<string, '_hash', BlockI>('_hash', block) === blockHash,
    ) ?? null;
  }

  public consensus(): Observable<Record<'note', string> & Record<'blockchain', Blockchain>> {
    const registerNodeObservables: Observable<AxiosResponse<Blockchain, AxiosRequestConfig<Blockchain>>>[] = [];
    const { networkNodes }: { networkNodes: URL[]} = this.blockchain;
    const { length: networkNodesLength }: { length: number } = networkNodes;

    if(networkNodesLength !== 0) {

      networkNodes.forEach((networkNodeUrl: URL): void => {
        const requestOptions: AxiosRequestConfig<Blockchain> = { responseType: 'json' };
        const getUrl: URL = new URL('/v1/blockchain', networkNodeUrl);
        const get$: Observable<AxiosResponse<Blockchain, AxiosRequestConfig<Blockchain>>> =
            this.httpService.get<Blockchain>(`${getUrl}`, requestOptions);

        registerNodeObservables.push(get$);
      });

      return forkJoin<AxiosResponse[]>(registerNodeObservables).pipe(map((responses: AxiosResponse<Blockchain>[]): Record<'note', string> & Record<'blockchain', Blockchain> => {
        const { length: currentChainLength }: { length: number } = this.blockchain.chain;
        let maxChainLength: number = currentChainLength;
        let newLongestChain: Array<BlockI> = null;
        let newPendingTransactions: Array<TransactionI> = null;

        responses.forEach((responseBlockchain: AxiosResponse<Blockchain>): void => {
          //this.logger.log(`> ${responseBlockchain.config.url} > ${responseBlockchain.status} > ${JSON.stringify(responseBlockchain.data)}`);
          const blockchain: Blockchain = responseBlockchain.data;
          const chain: Array<BlockI> = prop<Array<BlockI>, '_chain', Blockchain>('_chain', blockchain);
          const { length: chainLength }: { length: number } = chain;

          if(chainLength > maxChainLength) {
            newPendingTransactions = prop<TransactionI[], '_pendingTransactions', Blockchain>('_pendingTransactions', blockchain);
            newLongestChain = chain;
            maxChainLength = chainLength;
          }
        });

        if(isNil(newLongestChain) || (newLongestChain && not(this.blockchain.blockchainIsValid(newLongestChain)))) {
          return {
            note: 'Current chain has not been replaced.',
            blockchain: this.blockchain
          }
        } else {
          this.blockchain.chain = newLongestChain;
          this.blockchain.pendingTransactions = newPendingTransactions;

          return {
            note: 'This chain has been replaced.',
            blockchain: this.blockchain
          }
        }
      }));
    } else {
      return new Observable<Record<'note', string> & Record<'blockchain', Blockchain>>((observer: Subscriber<Record<'note', string> & Record<'blockchain', Blockchain>>): void => {
        observer.next({
          note: 'There are no network nodes to reach a consensus.',
          blockchain: this.blockchain
        });
        observer.complete();
      });
    }
  }

  public blockchainIsValid(blockchain: BlockI[]): boolean {
    return this.blockchain.blockchainIsValid(blockchain);
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
    const registerNodeObservables: Observable<AxiosResponse<URL, boolean>>[] = [];
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

  public mine(): MineResponse {
    const transaction: TransactionI = this.blockchain.createNewTransaction(null, '00', this.nodeUUID);
    this.blockchain.addNewTransactionToPendingTransaction(transaction);

    const lastBlock: BlockI = this.getLastBlock();
    const { index: lastBlockIndex }: { index: number } = lastBlock;
    const { hash: previousBlockHash }: { hash: string } = lastBlock;
    const index: number = inc(lastBlockIndex);
    const transactions: TransactionI[] = this.blockchain.pendingTransactions;
    const currentBlockData: CurrentBlockData = { index, transactions };
    const nonce: number = this.blockchain.proofOfWork(previousBlockHash, currentBlockData);
    const hash: string = this.blockchain.calculateHash(previousBlockHash, currentBlockData, nonce);
    const payload: MinePayload = { nonce, previousBlockHash, hash };
    const mineResponse: MineResponse = this.createMineResponse(payload);
    const block: BlockI = mineResponse.block;
    const { href }: { href: string } = this.blockchain.currentNodeUrl;
    const requestOptions: AxiosRequestConfig<URL> = {
      responseType: 'json',
      headers: {
        'x-network-node': href
      }
    };

    const axiosRequests: Array<Observable<AxiosResponse<BlockI, unknown>>> =
        this.blockchain.networkNodes.map((networkNodeUrl: URL) =>
          this.httpService.post<BlockI>(`${new URL('/v1/receive-new-block', networkNodeUrl)}`, block, requestOptions));

    const forkJoinSubscription: Subscription = forkJoin<AxiosResponse[]>(axiosRequests).subscribe((responses: AxiosResponse<URL>[]): void => {
      responses.forEach((response: AxiosResponse<URL>): void => {
        //this.logger.log(`> ${response.config.url} > ${response.status} > ${JSON.stringify(response.data)}`);

        // console.log('##############');
        // console.log(response.status);
        // console.log(response.data);
      });
    });

    this.subscriptions.push(forkJoinSubscription);

    return mineResponse;
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

    if(returnValue === ResponseStatusRange.ok) {
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
    }

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

  public signBlock(block: BlockI | {}): BlockSignature {
    const dataToSignString: string = JSON.stringify(block);
    const sign: Sign = createSign('RSA-SHA256').update(dataToSignString).end();
    const { privateKey, publicKey }: KeyPairSyncResult<string, string> = this.keys;
    const signature: string = sign.sign(privateKey, 'hex');

    return {
      publicKey,
      signature
    };
  }

  private verifyBlock({ publicKey, signature }: BlockSignature, block: BlockI): boolean {
    const dataToSignString: string = JSON.stringify(block);
    const verify: Verify = createVerify('RSA-SHA256').update(dataToSignString).end();

    return verify.verify(publicKey, signature);
  }
}
