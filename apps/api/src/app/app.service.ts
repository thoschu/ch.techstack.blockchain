import { Injectable } from '@nestjs/common';
import { Message } from '@ch.techstack.blockchain/api-interfaces';

@Injectable()
export class AppService {
  getData(): Message {
    return { message: 'Welcome to api!' };
  }
}
