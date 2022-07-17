import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Logger, Post, Req, Request, Res, Response } from '@nestjs/common';
import { Boom, forbidden, notFound } from '@hapi/boom';

import { prop, Placeholder, __ } from 'ramda';
import { v5 } from 'uuid';

import { IBlock, IBlockchain, ITransaction } from "@ch.techstack.blockchain/blockchain-interface";

import { AppService } from './app.service';

@Controller('v1')
export class AppController {
  private static readonly nodeAddress: string = v5('#', '6fc2e23a-95d3-4004-be9b-28c044403004');
  private readonly _blockchain: IBlockchain<IBlock, ITransaction>;

  constructor(private readonly appService: AppService) {
    this._blockchain = appService.blockchain;

    this._init();
  }

  private _init(): void {
    const processId: number = process.pid;
    const logMessage = `Node with uuid \x1b[31m${AppController.nodeAddress}\x1b[32m started on pid \x1b[35m${processId}`;

    Logger.log(logMessage, this.constructor.name, true);
  }

  @Get()
  @HttpCode(HttpStatus.NOT_FOUND)
  public notFound(@Req() request: Request): Boom<string> {
    const url: string = request.url;
    const httpVerb: string = request.method;

    // Logger.error(`Route: ${url} via ${httpVerb}: ${HttpStatus.NOT_FOUND}`, notFound<string>(httpVerb, url).stack, this.constructor.name);
    // ${notFound<string>(httpVerb, url).stack}
    Logger.warn(`Route: ${url} via ${httpVerb}: ${HttpStatus.NOT_FOUND}`, this.constructor.name);

    return notFound<string>(httpVerb, url);
  }

  @Get('blockchain')
  @HttpCode(HttpStatus.OK)
  public getBlockchain(): IBlockchain<IBlock, ITransaction> {
    return this.appService.blockchain;
  }

  @Get('mine')
  // @HttpCode(HttpStatus.CREATED)
  public mineNewBlock(@Req() request: Request): { note: string, block: IBlock } {
    const lastBlock: IBlock = this._blockchain.getLastBlock();
    const previousBlockHash: string = lastBlock.hash;

    const currentBlockData: Array<ITransaction> = this._blockchain.pendingTransactions;
    const nonce: number = this._blockchain.proofOfWork(previousBlockHash, currentBlockData);
    const hash: string = this._blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);
    const block: IBlock = this._blockchain.createNewBlock(nonce, previousBlockHash, hash);
    const note = "New block mined successfully";
    const headers: Headers = request.headers;
    const headersFn: (k: keyof Headers) => Headers[keyof Headers] = prop<Headers>(__, headers);
    const key = 'user-agent';
    const blockString: string = JSON.stringify(block);
    const userAgent: Headers[keyof Headers] = headersFn(key as keyof Headers);
    const logMessage = `${note} ${blockString} by ${userAgent}`;

    Logger.log(logMessage, this.constructor.name, true);

    return {
      note,
      block
    };
  }

  @Post('transaction')
  @HttpCode(HttpStatus.CREATED)
  public createNewTransactionAndReturnsBlockIndex(@Headers() headers: Headers, @Body() body: ITransaction): { note: string, index: number, body: ITransaction } {
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
}
