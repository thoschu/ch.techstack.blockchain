import { Controller, Get } from '@nestjs/common';

import { Message } from '@ch.techstack.blockchain/api-interfaces';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  public get(): Message {
    return { message: 'xxx' };
  }

  @Get('hello')
  public getData(): Message {
    return this.appService.getData();
  }
}
