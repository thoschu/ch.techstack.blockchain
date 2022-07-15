import { Module } from '@nestjs/common';

import { BlockchainModule } from '@ch.techstack.blockchain/blockchain';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [BlockchainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
