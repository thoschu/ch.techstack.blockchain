import { isMaster, fork, on, Cluster, Worker, isWorker, setupMaster, ClusterSettings } from 'cluster';
import { CpuInfo, cpus } from 'os';
import { INestApplication, Logger, NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

import helmet from 'helmet';
import { IncomingMessage, ServerResponse } from "http";
import { always, filter, head, last, pipe, split, tryCatch } from 'ramda';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (isMaster) {
  const totalCPUs: Array<CpuInfo> = cpus();
  const totalCPUsLength: number = totalCPUs.length;
  const clusterSettings: ClusterSettings = { silent: false, inspectPort: 4567 };

  if(!environment.production) {
    setupMaster(clusterSettings);
  }

  for (let i = 0; i < totalCPUsLength; i++) {
    const w: Worker = fork();
    const workerId: number = w.id;

    Logger.log(`▶ Worker: ${workerId} started.`, 'Main');
  }

  Logger.log(`Number of CPUs is ${totalCPUsLength} / Master ${process.pid} is running`, 'Main');

  on('exit', (worker: Worker, code: number, signal: string) => {
    const w: Worker = fork();

    Logger.log(`Worker ▶ ${worker.process.pid} died. Let's fork another worker! Worker ▶ ${w.id} restarted. ${code}`, `Main ${signal}`);
  });
} else if(isWorker) {
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
    const config: Omit<OpenAPIObject, 'paths' | 'components'> = new DocumentBuilder()
      .setTitle('Blockchain')
      .setDescription('API description')
      .setVersion('1.0')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addTag('blockchain')
      .build();

    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);

    app.use(helmetFn);
    app.setGlobalPrefix(globalPrefix);

    await app.listen(port, () => {
      const environmentName: string = environment.name;

      Logger.log(`Listening ▶ ${environmentName} ◀ at http://localhost:${port}/${globalPrefix}`, 'Main');
    });
  })();
} else {
  const error: Error = new Error('Something went wrong');

  Logger.log(error.stack, 'Main');

  throw error;
}
