import {INestApplication, Logger, NestApplicationOptions} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import helmet from 'helmet';
import { IncomingMessage, ServerResponse } from "http";
import { always, filter, head, last, pipe, split, tryCatch } from 'ramda';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

(async () => {
  const fallbackPort = '4444';
  const defaultPort = environment.port || fallbackPort;
  const argv: Array<string> = process.argv;
  const args: Array<string> = argv.slice(2);
  const isPort: (arg: string) => boolean = arg => arg.startsWith('PORT');
  const filterFn: (args: Array<string>) => Array<string> = filter<string>(isPort);
  const splitFn = split('=');
  const pipeFn = pipe(filterFn, head, splitFn, last);
  const argsPort: unknown = tryCatch(pipeFn, always<string>(defaultPort))(args);
  const port: string = process.env.PORT || argsPort as string;
  const options: NestApplicationOptions = { logger: true };
  const app: INestApplication = await NestFactory.create(AppModule, options);
  const helmetFn: (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void = helmet();
  const globalPrefix = 'api';

  app.use(helmetFn);
  app.setGlobalPrefix(globalPrefix);

  await app.listen(port, () => {
    const environmentName: string = environment.name;

    Logger.log(`Listening ▶ ${environmentName} ◀ at http://localhost:${port}/${globalPrefix}`, 'Main');
  });
})();
