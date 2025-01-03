import { Server } from 'http';
import { AddressInfo } from 'net';
import { env } from 'process';
import express, {Express, Request, Response} from 'express';
import expressStatusMonitor  from 'express-status-monitor';
import { format, transports }  from 'winston';
import expressWinston  from 'express-winston';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';

import { swaggerSpecs } from '@api/api-v3/swagger';
import getRoutes from '@routes/get.routes';
import postRoutes from '@routes/post.routes';
import { Blockchain } from '@blockchain/blockchain.class';

const port: number = parseInt(env.PORT ?? '4000', 10);
const app: Express = express();
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
app.use('/explorer', express.static(__dirname + '/'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/v3', getRoutes);
app.use('/api/v3', postRoutes);

app.get('/', (req: Request, res: Response): void => {
  res.redirect(301, '/explorer');
});

const server: Server = app.listen(port, '0.0.0.0', 0,(): void => {
  const protocol: string = 'http:';
  const { address }: { address: string } = <AddressInfo>server.address();
  const baseUrl: string = `${protocol}//${address}:${port}`;
  const url: URL = new URL('/', baseUrl);

  blockchain = new Blockchain<number>(url);

  console.log(`[server]: Server is running at: ${blockchain.networkNode}`);
});

process.on('SIGBREAK', (): void => {
  server.close((): void => {
    console.log('SIGNAL BREAK RECEIVED')
  });
});

export default app;
