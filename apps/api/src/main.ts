import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

import { environment } from './environments/environment';

class Main implements Object {
  private static app: INestApplication;
  private static readonly globalPrefix = 'api';
  private static readonly defaultPort = 3333;
  private static readonly host = environment.host;
  private static readonly port = process.env.PORT || Main.defaultPort;
  private static readonly appPromise: Promise<INestApplication> = NestFactory.create(AppModule);
  protected static readonly running: Main = new Main();

  constructor() {
    Main.init();

    console.log(environment);
  }

  private static async init(): Promise<void> {
    Main.app = await Main.appPromise;
    Main.setGlobalPrefix();
    await Main.listen();
  }

  private static setGlobalPrefix(): void {
    Main.app.setGlobalPrefix(Main.globalPrefix);
  }

  private static async listen() {
    await Main.app.listen(Main.port, () => {
      const protocol = 'http';
      const logMessage = `Listening at ${protocol}://${Main.host}:${Main.port}/${ Main.globalPrefix}`;

      Logger.log(logMessage);
    });
  }
}
