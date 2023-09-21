import process from 'node:process';
import { IncomingHttpHeaders } from 'http';
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger, Param,
  Post,
  Redirect,
  Req,
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
  ResponseStatusRange,
} from './app.service';
import { TransactionI } from '@/transaction/transaction.interface';
import { equals, inc, prop } from 'ramda';
import { BlockI } from '@/block/block.interface';
import {firstValueFrom} from "rxjs";

@ApiTags('v1')
@Controller('v1')
export class AppV1Controller {
  private readonly logger: Logger = new Logger('AppV1Controller');
  constructor(private readonly appService: AppService) {}

  @Post('/connect-socket')
  public socketIoConnect(
    @Body() body: Record<'url', string>,
  ): unknown | HttpException {
    this.logger.log(`> /register-broadcast-node :: ${process.pid}`);
    const { url }: Record<'url', string> = body;
    const socket = require('socket.io-client')(url);

    return socket;
  }

  @Get('/block/:blockHash')
  @Header('Cache-Control', 'none')
  public blockHash(@Param('blockHash') blockHash: string): BlockI {
    //this.logger.log(`> /block/:blockHash :: ${process.pid}`);

    return this.appService.getBlockByBlockHash(blockHash);
  }

  @Get('/transaction/:transactionId')
  @Header('Cache-Control', 'none')
  public transactionId(@Param('transactionId') transactionId: string): any {
    //this.logger.log(`> /block/:blockHash :: ${process.pid}`);

    return transactionId;
  }

  @Get('/address/:address')
  @Header('Cache-Control', 'none')
  public address(@Param('address') address: string): any {
    //this.logger.log(`> /block/:blockHash :: ${process.pid}`);

    return address;
  }

  @Post('/blockchainIsValid')
  @Header('Cache-Control', 'none')
  public blockchainIsValid(@Body() body: Array<BlockI>): boolean {
    this.logger.log(`> /blockchainIsValid :: ${process.pid}`);

    return this.appService.blockchainIsValid(body);
  }

  @Get('/consensus')
  @Header('Cache-Control', 'none')
  public async consensus(): Promise<Record<'note', string> & Record<'blockchain', Blockchain>> {
    this.logger.log(`> /consensus :: ${process.pid}`);

    return await firstValueFrom(this.appService.consensus());
  }


  @Get('/blockchain')
  @Header('Cache-Control', 'none')
  public blockchain(): Blockchain {
    this.logger.log(`> /blockchain :: ${process.pid}`);
    return this.appService.getBlockchain();
  }

  @Get('/mine')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  public mine(): any {
    this.logger.log(`> /mine :: ${process.pid}`);

    return this.appService.mine();
  }

  @Post('/receive-new-block')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  public receiveNewBlock(@Body() body: BlockI): MineResponse | unknown {
    this.logger.log(`> /receive-new-block :: ${process.pid}`);
    const blockChain: Blockchain = this.appService.getBlockchain();
    const lastBlock: BlockI = blockChain.getLastBlock();
    const previousBlockHash: string = prop<
      string,
      '_previousBlockHash',
      BlockI
    >('_previousBlockHash', body);
    const lastBlockHash: string = prop<string, '_hash', BlockI>(
      '_hash',
      lastBlock,
    );
    const index: number = prop<string, '_index', BlockI>('_index', body);
    const lastBlockIndex: number = prop<string, '_index', BlockI>(
      '_index',
      lastBlock,
    );
    const lastBlockIndexInc: number = inc(lastBlockIndex);
    const correctHash: boolean = equals<string>(
      previousBlockHash,
      lastBlockHash,
    );
    const correctIndex: boolean = equals<number>(index, lastBlockIndexInc);

    if (correctHash && correctIndex) {
      blockChain.chain.push(body);
      blockChain.pendingTransactions = [];
      return {
        note: `!!!! New block received and accepted in the chain.`,
        block: body,
      };
    } else {
      return {
        note: `???? New block rejected and NOT accepted in the chain.`,
        block: body,
      };
    }
  }

  @Post('/transaction')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: Transaction,
  })
  public transaction(
    @Body() body: TransactionI,
    @Req() request: Request,
  ): number | HttpException {
    this.logger.log(`> /v1/transaction :: ${process.pid}`);
    const headers: IncomingHttpHeaders = request.headers;
    const xNetworkNodeHeader: string = prop<string>('x-network-node', headers);
    const isSenderAllowedToSendTransaction: boolean =
      this.appService.isSenderAllowedToSendTransaction(xNetworkNodeHeader);

    return isSenderAllowedToSendTransaction
      ? this.appService.addNewTransactionToPendingTransaction(body)
      : new HttpException('NOT ACCEPTABLE', HttpStatus.NOT_ACCEPTABLE);
  }

  @Post('/transaction/broadcast')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  public transactionBroadcast(
    @Body() body: TransactionData,
  ): Record<'note', string> | HttpException {
    const { value, sender, recipient, data }: PendingTransactionPayload = body;
    const transaction: TransactionI = this.appService.createNewTransaction({
      value,
      sender,
      recipient,
      data,
    });
    const transactionIndex: number =
      this.appService.addNewTransactionToPendingTransaction(transaction);
    const broadcastTransactionToNetworkStatus: ChainActionStatusRange =
      this.appService.broadcastTransactionToNetwork(transaction);

    if (broadcastTransactionToNetworkStatus !== ResponseStatusRange.ok) {
      return {
        note: `❗ Transaction created and broadcast was not successfully.`,
      };
    }

    return {
      note: `✅ Transaction created and broadcast successfully in block with index: ${transactionIndex}.`,
    };
  }

  @Post('/register-broadcast-node')
  @Header('Cache-Control', 'none')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: `New node registered with network successfully.`,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' })
  public registerAndBroadcastNode(
    @Body() body: Record<'url', string>,
  ): Record<'note' | 'status', string> | HttpException {
    this.logger.log(`> /register-broadcast-node :: ${process.pid}`);
    const { url }: Record<'url', string> = body;
    const result: ChainActionStatusRange =
      this.appService.registerAndBroadcastNode(url);

    switch (result) {
      case ResponseStatusRange.ok:
        return {
          note: `✅ New node with the url: ${url} registered with network successfully.`,
          status: `${result}`,
        };
      case ResponseStatusRange.warn:
      case ResponseStatusRange.failure:
      default:
        return {
          note: `❗ New node with the url: ${url} is not valid.`,
          status: `${result}`,
        };
    }
  }

  @Post('/register-node')
  @Header('Cache-Control', 'none')
  public registerNode(
    @Body() body: Record<'url', string>,
  ): Record<'note' | 'status', string> | HttpException {
    this.logger.log(`> /register-node :: ${process.pid}`);
    const { url }: Record<'url', string> = body;
    const result: ChainActionStatusRange = this.appService.registerNode(url);

    switch (result) {
      case ResponseStatusRange.ok:
        return {
          note: `New node with the url: ${url} registered successfully with node.`,
          status: `${result}`,
        };
      case ResponseStatusRange.warn:
      case ResponseStatusRange.failure:
      default:
        return {
          note: `New node with the url: ${url} NOT registered with node.`,
          status: `${result}`,
        };
    }
  }

  @Post('/register-nodes-bulk')
  @Header('Cache-Control', 'none')
  public registerNodesBulk(
    @Body() body: Record<'allNetworkNodes', string[]>,
  ): Record<'note' | 'status', string> | HttpException {
    this.logger.log(`> /register-nodes-bulk :: ${process.pid}`);
    const allNetworkNodes: URL[] = body.allNetworkNodes.map(
      (url: string): URL => new URL(url),
    );
    const result: ChainActionStatusRange =
      this.appService.registerNodesBulk(allNetworkNodes);
    const url: URL = this.appService.identity.url;

    switch (result) {
      case ResponseStatusRange.ok:
        return {
          note: `Bulk registration on node: ${url} successful.`,
          status: `${result}`,
        };
      case ResponseStatusRange.warn:
      case ResponseStatusRange.failure:
      default:
        return {
          note: `Bulk registration on node: ${url} NOT successful.`,
          status: `${result}`,
        };
    }
  }

  @Get('*')
  @Redirect('/', 301)
  public wildcard(): void {
    this.logger.log(`>/ :: ${process.pid}`);
  }
}
