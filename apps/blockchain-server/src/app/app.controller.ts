import { Controller, Get, Post, Req, Request } from '@nestjs/common';

import { IBlock } from "@ch.techstack.blockchain/blockchain-interface";

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getBlockchain(@Req() req: Request): Array<IBlock> {
    console.log(req);
    return this.appService.blockchain.chain;
  }

  @Get('mine')
  mineNewBlock(): IBlock | any {
    return '######';
  }

  @Post('transaction')
  createNewTransaction(): number {
    console.log('*****************************************');
    return 77;
  }
}
