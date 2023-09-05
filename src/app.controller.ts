import process from 'node:process';
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode, HttpException,
  HttpStatus, Logger,
  Post,
  Redirect, Req, Res
} from '@nestjs/common';
import { ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Blockchain } from '@/blockchain';
import { Transaction, TransactionData } from '@/transaction/transaction.class';

import {
  AppService,
  ChainActionStatusRange,
  MineResponse,
  PendingTransactionPayload,
  ResponseStatusRange
} from './app.service';
import {TransactionI} from "@/transaction/transaction.interface";

@ApiTags('v1')
@Controller('v1')
export class AppV1Controller {
  private readonly logger: Logger = new Logger('AppV1Controller');
  constructor(private readonly appService: AppService) {}

  @Get('/blockchain')
  @Header('Cache-Control', 'none')
  public blockchain(): Blockchain {
    this.logger.log(`> /blockchain :: ${process.pid}`);
    return this.appService.getBlockchain();
  }

  @Get('/mine')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  public mine(): MineResponse {
    this.logger.log(`> /mine :: ${process.pid}`);
    return this.appService.mine();
  }

  @Post('/transaction')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: Transaction
  })
  public transaction(@Body() body: TransactionI, @Req() request: Request): number | HttpException  {
    this.logger.log(`> /v1/transaction :: ${process.pid}`);
    const { headers } = request;
    console.log(headers.client);
    // return isNodeAllowedTo ? this.appService.addNewTransactionToPendingTransaction(body) : -1;
    return this.appService.addNewTransactionToPendingTransaction(body) ?? new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
  }

  @Post('/transaction/broadcast')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  public transactionBroadcast(@Body() body: TransactionData): Record<'note', string> | HttpException {
    const { value, sender, recipient, data }: PendingTransactionPayload = body;
    const transaction: TransactionI = this.appService.createNewTransaction({ value, sender, recipient, data });
    const addNewTransactionToPendingTransactionStatus: ChainActionStatusRange = this.appService.addNewTransactionToPendingTransaction(transaction);
    const broadcastTransactionToNetworkStatus: ChainActionStatusRange = this.appService.broadcastTransactionToNetwork(transaction);

    if(broadcastTransactionToNetworkStatus !== ResponseStatusRange.ok || addNewTransactionToPendingTransactionStatus !== ResponseStatusRange.ok) {
      return { note: `Transaction created and broadcast was not successfully.`}
    }

    return { note: `Transaction created and broadcast successfully.`}
  }

  @Post('/register-broadcast-node')
  @Header('Cache-Control', 'none')
  @ApiResponse({ status: HttpStatus.CREATED, description: `New node registered with network successfully.`})
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST'})
  public registerAndBroadcastNode(@Body() body: Record<'url', string>): Record<'note' | 'status', string> | HttpException {
    this.logger.log(`> /register-broadcast-node :: ${process.pid}`);
    const { url }: Record<'url', string> = body;
    const result: ChainActionStatusRange = this.appService.registerAndBroadcastNode(url);

    switch (result) {
      case ResponseStatusRange.ok:
        return { note: `New node with the url: ${url} registered with network successfully.`, status: `${result}` }
      case ResponseStatusRange.warn:
      case ResponseStatusRange.failure:
      default:
        return { note: `New node with the url: ${url} is not valid.`, status: `${result}` }
    }
  }

  @Post('/register-node')
  @Header('Cache-Control', 'none')
  public registerNode(@Body() body: Record<'url', string>): Record<'note' | 'status', string> | HttpException {
    this.logger.log(`> /register-node :: ${process.pid}`);
    const { url }: Record<'url', string> = body;
    const result: ChainActionStatusRange = this.appService.registerNode(url);

    switch (result) {
      case ResponseStatusRange.ok:
        return { note: `New node with the url: ${url} registered successfully with node.`, status: `${result}`};
      case ResponseStatusRange.warn:
      case ResponseStatusRange.failure:
      default:
        return { note: `New node with the url: ${url} NOT registered with node.`, status: `${result}`};
    }
  }

  @Post('/register-nodes-bulk')
  @Header('Cache-Control', 'none')
  public registerNodesBulk(@Body() body: Record<'allNetworkNodes', string[]>): Record<'note' | 'status', string> | HttpException {
    this.logger.log(`> /register-nodes-bulk :: ${process.pid}`);
    const allNetworkNodes: URL[] = body.allNetworkNodes.map((url: string): URL => new URL(url));
    const result: ChainActionStatusRange = this.appService.registerNodesBulk(allNetworkNodes);
    const url: URL = this.appService.identity.url;

    switch (result) {
      case ResponseStatusRange.ok:
        return { note: `Bulk registration on node: ${url} successful.`, status: `${result}`};
      case ResponseStatusRange.warn:
      case ResponseStatusRange.failure:
      default:
        return { note: `Bulk registration on node: ${url} NOT successful.`, status: `${result}`};
    }
  }

  @Get('*')
  @Redirect('/', 301)
  public wildcard(): void {
    this.logger.log(`>/ :: ${process.pid}`);
  }
}
