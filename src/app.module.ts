import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ServeStaticModule, ServeStaticModuleOptions } from '@nestjs/serve-static';
import { join } from 'path';

import { AppV1Controller } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ServeStaticModule.forRoot(AppModule.OPTIONS)
  ],
  controllers: [AppV1Controller],
  providers: [AppService]
})
export class AppModule {
  private static readonly OPTIONS: ServeStaticModuleOptions = {
    rootPath: join(__dirname, '../..', 'assets')
  };
}
