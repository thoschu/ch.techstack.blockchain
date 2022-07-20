import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';

import { assoc } from 'ramda';

import { MysqlNestjsConnectorService } from './mysql-nestjs-connector.service';
import { UserDto } from './mysql-nestjs-connector.entity';

@Module({
  imports: [],
  providers: [],
  exports: [],
  controllers: []
})
export class MysqlNestjsConnectorModule {
  private static readonly secret = 'hard!to-guess_secret';

  public static forRoot(options: TypeOrmModuleOptions): DynamicModule {
    const typeOrmModuleOptions: TypeOrmModuleOptions = assoc<(typeof UserDto)[], TypeOrmModuleOptions, 'entities'>('entities', [UserDto], options) as TypeOrmModuleOptions;
    const secret: string = MysqlNestjsConnectorModule.secret;

    return {
      module: MysqlNestjsConnectorModule,
      imports: [
        TypeOrmModule.forRoot(typeOrmModuleOptions),
        TypeOrmModule.forFeature([UserDto]),
        JwtModule.register({ secret })
      ],
      controllers: [],
      providers: [MysqlNestjsConnectorService],
      exports: [MysqlNestjsConnectorService],
    };
  }
}
