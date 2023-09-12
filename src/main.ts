import cluster, { Worker } from 'node:cluster';
import { availableParallelism } from 'node:os';
import process from 'node:process';
import { DynamicModule, INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet, { HelmetOptions } from 'helmet';
import { prop } from 'ramda';
import { Server } from 'socket.io';

import 'dotenv/config';

import { AppModule } from './app.module';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {DefaultEventsMap} from "socket.io/dist/typed-events";

const localDevCPUs: number = 1;
const numCPUs: number = localDevCPUs ?? availableParallelism();
const logger: Logger = new Logger('Server');

if (cluster.isPrimary) {
  logger.warn(`Primary process: ${process.pid} is running with ${numCPUs} workers`);

  for (let i: number = 0; i < numCPUs; i++) {
    const worker: Worker = cluster.fork();

    worker.send(JSON.stringify({ primaryPid: process.pid }));
  }

  cluster.on('exit', (worker: Worker, code: number, signal: string): void => {
    logger.warn(`worker ${worker.process.pid} died by ${code} and ${signal}`);

    cluster.fork();
  });
} else {

  process.on('message', (message: string): void => {
    logger.verbose(`Received in Worker ${cluster.worker.id}:`, message);
    const { primaryPid }: { primaryPid: number } = JSON.parse(message);
    const workerPid: number = process.pid;
    const worker: number = cluster.worker.id;

    if (message) {
      (async ({argv, env}: { argv: string[]; env: NodeJS.ProcessEnv }): Promise<void> => {
        const protocol: string = 'http';
        const host: string = 'localhost';
        const port: number = parseInt(argv[2], 10) || parseInt(prop('DEFAULT_PORT', env), 10);
        const url: URL = new URL(argv[3]) ?? new URL(`${protocol}://${host}:${port}`)
        const appDynamicModule: DynamicModule = AppModule.register({ primaryPid, workerPid, worker, url });
        const app: INestApplication = await NestFactory.create(appDynamicModule);
        const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, unknown> = new Server(app.getHttpServer());
        console.log(io);
        io.on('connection', (socket) => {
          console.log('Ein Knoten hat sich verbunden.');

          // Hier können Sie auf Ereignisse von diesem Knoten hören und Nachrichten senden
          socket.on('customEvent', (data) => {
            console.log('Nachricht von einem Knoten:', data);
          });
        });
        const helmetOptions: HelmetOptions = {
          crossOriginEmbedderPolicy: false,
          crossOriginOpenerPolicy: true,
          crossOriginResourcePolicy: true,
          originAgentCluster: true,
          referrerPolicy: true,
          contentSecurityPolicy: {
            directives: {
              imgSrc: [`'self'`, 'data:', 'localhost', 'https://www.thomas-schulte.de/images/made_with_love.gif'],
              scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
              manifestSrc: [`'self'`, 'localhost'],
              frameSrc: [`'self'`, 'localhost'],
              defaultSrc: [`'self'`, 'localhost'],
              fontSrc: [`'self'`, 'fonts.gstatic.com', 'data:'],
            },
          },
        };

        app.use(helmet(helmetOptions));

        const config = new DocumentBuilder()
            .setTitle('blockchain example')
            .setDescription('The blockchain API description')
            .setVersion('1.0')
            .addTag('blockchain')
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api', app, document);

        // https://socket.io/docs/v4/using-multiple-nodes
        io.on("connection", (socket): void => {
          console.log(socket);
        });

        await app.listen(port);

        logger.log(`Started: ${new URL(`http://localhost:${port}`)} - pid: ${process.pid} and worker: ${cluster.worker.id} from ${primaryPid}`);
      })({ argv: process.argv, env: process.env });
    }

    process.send({ message: `${cluster.worker.id}` });
  });

  logger.debug(`Worker ${cluster.worker.id} started in process with id: ${process.pid}`);
}
