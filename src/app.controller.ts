import { Controller, Get, Header } from '@nestjs/common';
import { BlockI } from '@/block/block.interface';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get()
  public getHello(): string {
    return this.appService.getHello();
  }

  @Get('/blockchain')
  @Header('Cache-Control', 'none')
  public blockchain(): BlockI[] {
    return this.appService.getBlockchain();
  }
}
