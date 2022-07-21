import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

import { assoc } from 'ramda';
import { SignOptions } from 'jsonwebtoken';

import { MysqlNestjsConnectorController } from './mysql-nestjs-connector.controller';
import { MysqlNestjsConnectorService } from './mysql-nestjs-connector.service';
import { UserDto } from './mysql-nestjs-connector.entity';

@Module({
  imports: [PassportModule],
  providers: [MysqlNestjsConnectorService],
  exports: [MysqlNestjsConnectorService],
  controllers: [MysqlNestjsConnectorController]
})
export class MysqlNestjsConnectorModule {
  public static forRoot(options: TypeOrmModuleOptions, secret: string): DynamicModule {
    const typeOrmModuleOptions: TypeOrmModuleOptions =
      assoc<(typeof UserDto)[], TypeOrmModuleOptions, 'entities'>('entities',[UserDto], options) as TypeOrmModuleOptions;
    const signOptions: SignOptions = { expiresIn: '1h' };
    const jwtModuleOptions: JwtModuleOptions = { secret, signOptions };
    const entities: Array<EntityClassOrSchema> = [UserDto];

    return {
      module: MysqlNestjsConnectorModule,
      imports: [
        TypeOrmModule.forRoot(typeOrmModuleOptions),
        TypeOrmModule.forFeature(entities),
        JwtModule.register(jwtModuleOptions)
      ]
    };
  }
}
