import { randomUUID } from 'node:crypto';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ServeStaticModule, ServeStaticModuleOptions } from '@nestjs/serve-static';
import { join } from 'path';

import { AppV1Controller } from './app.controller';
import { AppService, Identity } from './app.service';

@Module({
  imports: [HttpModule, ServeStaticModule.forRoot(AppModule.OPTIONS)],
  controllers: [AppV1Controller]
})
export class AppModule {
  private static readonly OPTIONS: ServeStaticModuleOptions = {
    rootPath: join(__dirname, '../..', 'assets')
  };

  public static register({ primaryPid, workerPid, worker, url, uuid = randomUUID() }: Identity): DynamicModule {
    return {
      module: AppModule,
      providers: [
        {
          provide: 'IDENTITY',
          useValue: { primaryPid, workerPid, worker, url, uuid }
        },
        AppService
      ],
      exports: [AppService]
    };
  }
}
