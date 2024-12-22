import { Server } from 'http';

import express, { Express, Request, Response } from 'express';
import expressStatusMonitor  from 'express-status-monitor';
import { format, transports }  from 'winston';
import expressWinston  from 'express-winston';

import { Blockchain } from '@blockchain/blockchain.class';
import Block from '@blockchain/block/block.class';

const blockchain: Blockchain = new Blockchain();
const app: Express = express();
const port: string = process.env.PORT!;
const apiKey: string  = process.env.API_KEY!;

app.use(expressStatusMonitor());

app.use(expressWinston.logger({
  transports: [
    new transports.Console()
  ],
  format: format.combine(
    format.colorize(),
    // format.timestamp(),
    format.json()
  ),
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: true
}));

app.get('/', (req: Request, res: Response): void => {
  res.send(blockchain.id);
});

app.get('/info', async (req: Request, res: Response) => {
  const headers = {
    Accept: 'application/json',
    'X-API-Token': apiKey
  };

  const promRes: unknown = await fetch('https://api.blockchain.com/v3/exchange/l2/BTC-USD',{
      method: 'GET',
      headers
    })
    .then(async (res) => {
      return await res.json()
    })
    .then((body) => body);

  res.send(promRes);
});

app.get('/is-valid', (req: Request, res: Response): void => {
  const isValid: boolean = blockchain.isChainValid(blockchain.chain);

  res.send({
    'message': isValid ? 'The blockchain is valid! ✅' : 'The blockchain is not valid! ❌',
    'length': blockchain.chain.length
  });
});

app.get('/get-chain', (req: Request, res: Response): void => {
  res.send({
    'length': blockchain.chain.length,
    'chain': blockchain.chain,
    });
});

app.get('/mine-block', (req: Request, res: Response): void => {
  const previousBlock: Block = blockchain.getPreviousBlock()!;
  const previousProof: number = previousBlock.proof;
  const proof: number = blockchain.proofOfWork(previousProof);
  const previousHash: string = blockchain.hash(previousBlock);
  const block: Block = blockchain.createBlock(proof, previousHash);

  res.send({
    'message': 'Congratulations, you just mined a block!',
    'index': block.index,
    'timestamp': block.timestamp,
    'proof': block.proof,
    'previousHash': block.previousHash
  });
});

const server: Server = app.listen(port, (): void => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

process.on('SIGBREAK', (): void => {
  server.close((): void => {
    console.log('SIGNAL BREAK RECEIVED')
  });
});
