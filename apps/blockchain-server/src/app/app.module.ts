import { Module } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { BlockchainModule } from '@ch.techstack.blockchain/blockchain';
import { MysqlNestjsConnectorModule } from '@ch.techstack.blockchain/mysql-nestjs-connector';
import { AuthModule } from '@ch.techstack.blockchain/auth';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { environment } from '../environments/environment';

type MySqlConfig = Required<{
  port: number,
  url: string,
  database: string,
  username: string,
  password: string
}>;

@Module({
  imports: [
    BlockchainModule,
    MysqlNestjsConnectorModule.forRoot(AppModule.options),
    AuthModule.forRoot(AppModule.jwtSecret)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  private static readonly jwtSecret: string = environment.jwtSecret;
  private static readonly mySqlConfig: MySqlConfig = environment.mysql;
  private static readonly options: TypeOrmModuleOptions = {
    type: 'mysql',
    host: AppModule.mySqlConfig.url,
    port: AppModule.mySqlConfig.port,
    username: AppModule.mySqlConfig.username,
    password: AppModule.mySqlConfig.password,
    database: AppModule.mySqlConfig.database,
    entities: [],
    synchronize: false
  };
}
