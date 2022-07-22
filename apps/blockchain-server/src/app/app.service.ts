import { Headers, HttpStatus, Injectable, Logger, Request } from '@nestjs/common';

import { Boom, notFound } from "@hapi/boom";

import { __, prop } from "ramda";

import { IBlock, IBlockchain, ITransaction } from '@ch.techstack.blockchain/blockchain-interface';
import { BlockchainService } from "@ch.techstack.blockchain/blockchain";
// import { MysqlNestjsConnectorService, UserDto } from '@ch.techstack.blockchain/mysql-nestjs-connector';

@Injectable()
export class AppService {
  private readonly _blockchain: IBlockchain<IBlock, ITransaction>;

  constructor(
    private readonly blockchainService: BlockchainService,
    // private readonly mysqlNestjsConnectorService: MysqlNestjsConnectorService
  ) {
    this._blockchain = blockchainService.blockchain;

    // this.mysqlNestjsConnectorService.validateUser('thoschu', 'password')
    //   .then((result: Pick<UserDto, 'id' | 'username'>) => {
    //     console.log(result);
    //   });
  }

  public get blockchain(): IBlockchain<IBlock, ITransaction> {
    const note = "Blockchain deliverd";
    const logMessage = `${note}`;

    Logger.log(logMessage, this.constructor.name, true);

    return this._blockchain;
  }

  public notFound(request: Request): Boom<string> {
    const url: string = request.url;
    const httpVerb: string = request.method;
    const className: string = this.constructor.name;
    const error: Boom<string> = notFound<string>(httpVerb, url);
    const logMessage = `Route: ${url} via ${httpVerb}: ${HttpStatus.NOT_FOUND} > ${JSON.stringify(error)}`;

    Logger.warn(logMessage, className); // ${error.stack}

    return error;
  }

  public mineNewBlock(request: Request): { note: string, block: IBlock } {
    const lastBlock: IBlock = this._blockchain.getLastBlock();
    const previousBlockHash: string = lastBlock.hash;
    const currentBlockData: Array<ITransaction> = this._blockchain.pendingTransactions;
    const nonce: number = this._blockchain.proofOfWork(previousBlockHash, currentBlockData);
    const hash: string = this._blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);
    const block: IBlock = this._blockchain.createNewBlock(nonce, previousBlockHash, hash);
    const note = "New block mined successfully";
    const userAgent: Headers[keyof Headers] = AppService.fetchUserAgentHeader(request);
    const blockString: string = JSON.stringify(block);
    const logMessage = `${note} ${blockString} by ${userAgent}`;

    Logger.log(logMessage, this.constructor.name, true);

    return {
      note,
      block
    };
  }

  public createNewTransactionAndReturnsBlockIndex(body: ITransaction): { note: string, index: number, body: ITransaction } {
    const { payload, sender, recipient }: ITransaction = body;
    const index: number = this._blockchain.createNewTransaction(payload, sender, recipient);
    const id: number = this._blockchain.pendingTransactions.length;
    const note = `Transaction will be added to block ${index} at position ${id}`;
    const stringifyBody: string = JSON.stringify(body);
    const className: string = this.constructor.name;
    const logMessage = `Transaction ${stringifyBody} created and will be added to block ${index} at position ${id}`;

    Logger.log(logMessage, className, true);

    return { note, index, body };
  }

  private static fetchUserAgentHeader(request: Request): Headers[keyof Headers] {
    const headers: Headers = request.headers;
    const headersFn: (k: keyof Headers) => Headers[keyof Headers] = prop<Headers>(__, headers);
    const key = 'user-agent';

    return headersFn(key as keyof Headers);
  }
}
