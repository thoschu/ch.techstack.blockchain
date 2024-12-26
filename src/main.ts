import { Server } from 'http';
import { AddressInfo } from 'net';
import { env } from 'process';
import express, { Express } from 'express';
import expressStatusMonitor  from 'express-status-monitor';
import { format, transports }  from 'winston';
import expressWinston  from 'express-winston';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';

import { swaggerSpecs } from '@api/api-v3/swagger';
import getRoutes from '@routes/get.routes';
import postRoutes from '@routes/post.routes';
import { Blockchain } from "@blockchain/blockchain.class";

const app: Express = express();
const port: number = parseInt(env.PORT!, 10) ?? 3000;
export let blockchain: Blockchain<number>;

app.use(expressStatusMonitor());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(expressWinston.logger({
  transports: [
    new transports.Console()
  ],
  format: format.combine(
    format.colorize(),
    format.json()
  ),
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: true
}));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/v3', getRoutes);
app.use('/api/v3', postRoutes);

app.get('/', (req, res) => {
  res.redirect(301, '/api/v3/get-chain');
});

const server: Server = app.listen(port, '0.0.0.0', 0,(): void => {
  const protocol: string = 'http:';
  const { address }: { address: string } = <AddressInfo>server.address();
  const baseUrl: string = `${protocol}//${address}:${port}`;
  const url: URL = new URL('/', baseUrl);

  blockchain = new Blockchain<number>(url);

  blockchain.addNode(url);

  console.log(`[server]: Server is running at ${url.href}`);
});

process.on('SIGBREAK', (): void => {
  server.close((): void => {
    console.log('SIGNAL BREAK RECEIVED')
  });
});
