import { Module } from '@nestjs/common';

import { BlockchainService } from './blockchain.service';

@Module({
  controllers: [],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
