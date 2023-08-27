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
import { Blockchain } from '@/blockchain';
import { Transaction, TransactionData } from '@/transaction/transaction.class';

import { AppService, MineResponse, PendingTransactionPayload } from './app.service';

@ApiTags('v1')
@Controller('v1')
export class AppV1Controller {
  private readonly logger: Logger = new Logger('AppV1Controller');
  constructor(private readonly appService: AppService) {}

  @Get('/blockchain')
  @Header('Cache-Control', 'none')
  public blockchain(): Blockchain {
    this.logger.log(`/blockchain :: ${process.pid}`);
    return this.appService.getBlockchain();
  }

  @Get('/mine')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  public mine(): MineResponse {
    this.logger.log(`/mine :: ${process.pid}`);
    return this.appService.mine();
  }

  @Post('/transaction')
  @Header('Cache-Control', 'none')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: Transaction
  })
  public transaction(@Body() body: TransactionData): number {
    this.logger.log(`/transaction :: ${process.pid}`);
    const { value, sender, recipient, data }: PendingTransactionPayload = body;

    return this.appService.createNewPendingTransaction({ value, sender, recipient, data });
  }

  @Post('/register-broadcast-node')
  @Header('Cache-Control', 'none')
  @ApiResponse({ status: 201, description: `New node registered with network successfully.`})
  @ApiResponse({ status: 409, description: 'Conflict.'})
  public registerAndBroadcastNode(@Body() body: Record<'url', string>, @Req() req: Request) {
    this.logger.log(`/register-broadcast-node :: ${process.pid}`);
    const url: string = body.url;
    const newNodeUrl: URL = new URL(url);
    const successful: boolean = this.appService.registerAndBroadcastNode(newNodeUrl);

    console.log(successful);

    if (successful) {
      return { 'note': `New node with the url: ${newNodeUrl} registered with network successfully.` }
    } else {
      throw new HttpException('Conflict', HttpStatus.CONFLICT);
    }
  }

  @Post('/register-node')
  @Header('Cache-Control', 'none')
  public registerNode(@Body() body: Record<'url', string>): Record<'note', string> {
    this.logger.log(`/register-node :: ${process.pid}`);
    const url: string = body.url;
    const newNodeUrl: URL = new URL(url);

    this.appService.registerNode(newNodeUrl);

    return { note: `New node with the url: ${newNodeUrl} registered successfully with node.`};
  }

  @Post('/register-nodes-bulk')
  @Header('Cache-Control', 'none')
  public registerNodesBulk(@Body() body: Record<'allNetworkNode', string[]>): boolean {
    this.logger.log(`/register-nodes-bulk :: ${process.pid}`);
    const allNetworkNode: string[] = body.allNetworkNode;
    // console.log(allNetworkNode);

    return true;
  }

  @Get('*')
  @Redirect('/', 301)
  public wildcard(): void {
    this.logger.log(`/ :: ${process.pid}`);
  }
}
