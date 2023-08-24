import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Redirect,
} from '@nestjs/common';
import { Blockchain } from '@/blockchain';
import { TransactionData } from '@/transaction/transaction.class';

import { AppService, MineResponse, PendingTransactionPayload } from './app.service';

@Controller('v1')
export class AppV1Controller {
  constructor(private readonly appService: AppService) {}

  @Get('/blockchain')
  @Header('Cache-Control', 'none')
  public blockchain(): Blockchain {
    return this.appService.getBlockchain();
  }

  @Get('/mine')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  public mine(): MineResponse {
    return this.appService.mine();
  }

  @Post('/transaction')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  public transaction(@Body() body: TransactionData): number {
    const { value, sender, recipient, data }: PendingTransactionPayload = body;

    return this.appService.createNewPendingTransaction({ value, sender, recipient, data });
  }

  @Get('*')
  @Redirect('/', 301)
  public wildcard(): void {}
}
