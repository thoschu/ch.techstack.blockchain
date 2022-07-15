import { Controller, Get } from '@nestjs/common';

import { BlockchainService } from '@ch.techstack.blockchain/blockchain';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly blockchainService: BlockchainService) {
    console.log(blockchainService.foo());
  }

  @Get()
  getData() {
    return this.appService.getData();
  }
}
