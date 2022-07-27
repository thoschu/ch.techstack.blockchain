import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

import { assoc } from 'ramda';

import { MysqlNestjsConnectorService } from './mysql-nestjs-connector.service';
import { UserDto } from './mysql-nestjs-connector.entity';

@Module({
  providers: [MysqlNestjsConnectorService],
  controllers: [],
  exports: []
})
export class MysqlNestjsConnectorModule {
  public static forRoot(options: TypeOrmModuleOptions): DynamicModule {
    const typeOrmModuleOptions: TypeOrmModuleOptions =
      assoc<(typeof UserDto)[], TypeOrmModuleOptions, 'entities'>('entities',[UserDto], options) as TypeOrmModuleOptions;
    const entities: Array<EntityClassOrSchema> = [UserDto];

    return {
      module: MysqlNestjsConnectorModule,
      imports: [
        TypeOrmModule.forRoot(typeOrmModuleOptions),
        TypeOrmModule.forFeature(entities)
      ]
    };
  }
}
