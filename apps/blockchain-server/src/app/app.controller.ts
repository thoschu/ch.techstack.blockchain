import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Req, Request } from '@nestjs/common';
import { Boom, forbidden, notFound } from '@hapi/boom';

import { IBlock, IBlockchain, ITransaction } from "@ch.techstack.blockchain/blockchain-interface";

import { AppService } from './app.service';


@Controller('v1')
export class AppController {
  private readonly _blockchain: IBlockchain<IBlock, ITransaction>;

  constructor(private readonly appService: AppService) {
    this._blockchain = appService.blockchain;
  }

  @Get()
  @HttpCode(HttpStatus.NOT_FOUND)
  public notFound(@Req() request: Request): Boom<string> {
    const url: string = request.url;
    const httpVerb: string = request.method;

    return notFound<string>(httpVerb, url);
  }

  @Get('blockchain')
  @HttpCode(HttpStatus.OK)
  public getBlockchain(): IBlockchain<IBlock, ITransaction> {
    return this.appService.blockchain;
  }

  @Get('mine')
  @HttpCode(HttpStatus.CREATED)
  public mineNewBlock(@Request() req: Request): IBlock | any {
    return '######';
  }

  @Post('transaction')
  @HttpCode(HttpStatus.CREATED)
  public createNewTransactionAndReturnsBlockIndex(@Headers() headers: Headers, @Body() body: ITransaction): { note: string, index: number } {
    const { payload, sender, recipient }: ITransaction = body;
    const index: number = this._blockchain.createNewTransaction(payload, sender, recipient);
    const note = `Transaction will be added to block ${index}`;

    return { note, index };
  }
}
