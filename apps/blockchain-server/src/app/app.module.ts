import { Module } from '@nestjs/common';

import { BlockchainModule } from '@ch.techstack.blockchain/blockchain';
import { MysqlNestjsConnectorModule } from '@ch.techstack.blockchain/mysql-nestjs-connector';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { environment } from '../environments/environment';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

type MySqlConfig = {
  port: number,
  url: string,
  database: string,
  username: string,
  password: string
};

@Module({
  imports: [BlockchainModule, MysqlNestjsConnectorModule.forRoot(AppModule.options)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  private static mySqlConfig: MySqlConfig = environment.mysql;
  private static options: TypeOrmModuleOptions = {
    type: 'mysql',
    host: AppModule.mySqlConfig.url,
    port: AppModule.mySqlConfig.port,
    username: AppModule.mySqlConfig.username,
    password: AppModule.mySqlConfig.password,
    database: AppModule.mySqlConfig.database,
    entities: [],
    synchronize: false
  }
}
