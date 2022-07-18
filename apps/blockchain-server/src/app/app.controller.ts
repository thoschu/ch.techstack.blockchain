import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Logger, Post, Req, Request, Res, Response } from '@nestjs/common';
import { Boom } from '@hapi/boom';

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
    const className: string = this.constructor.name;

    Logger.log(logMessage, className, true);
  }

  @Get()
  @HttpCode(HttpStatus.NOT_FOUND)
  public notFound(@Req() request: Request): Boom<string> {
    return this.appService.notFound(request);
  }

  @Get('blockchain')
  public getBlockchain(): IBlockchain<IBlock, ITransaction> {
    return this.appService.blockchain;
  }

  @Get('mine')
  @HttpCode(HttpStatus.CREATED)
  public mineNewBlock(@Req() request: Request): { note: string, block: IBlock } {
    return this.appService.mineNewBlock(request);
  }

  @Post('transaction')
  public createNewTransactionAndReturnsBlockIndex(@Headers() headers: Headers, @Body() body: ITransaction): { note: string, index: number, body: ITransaction } {
    return this.appService.createNewTransactionAndReturnsBlockIndex(headers, body);
  }
}
