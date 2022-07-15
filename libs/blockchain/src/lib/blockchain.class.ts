import { clone, inc, last, length, not } from 'ramda';
import { x2 } from 'sha256';

import { IBlock, IBlockchain, ITransaction } from '@ch.techstack.blockchain/blockchain-interface';

export class Blockchain implements IBlockchain<IBlock> {
  private readonly _chain: Array<IBlock>;
  private readonly _pendingTransactions: Array<ITransaction>;

  constructor() {
    this._chain = [];
    this._pendingTransactions = [];

    this.init();
  }

  private init(): void {
    const genesisNonce = -1;
    const genesisPreviousBlockHash = '0';
    const genesisHash: string = x2('genesis');

    this.createNewBlock(genesisNonce, genesisPreviousBlockHash, genesisHash);
  }

  public get chain(): Array<IBlock> {
    return this._chain;
  }

  public get pendingTransactions(): Array<ITransaction> {
    return this._pendingTransactions;
  }

  public createNewBlock(nonce: number, previousBlockHash: string, hash: string): IBlock {
    const currentChainLength: number = length<Array<IBlock>>(this.chain);
    const index: number = inc(currentChainLength);
    const timestamp: number = Date.now();
    const transactions: Array<ITransaction> = clone<ITransaction>(this._pendingTransactions);

    const newBlock: IBlock = {
      index,
      timestamp,
      transactions,
      nonce,
      previousBlockHash,
      hash
    };

    this._pendingTransactions.length = 0;
    this._chain.push(newBlock);

    return newBlock;
  }

  public getLastBlock(): IBlock {
    return last<IBlock>(this._chain);
  }

  public createNewTransaction(payload: unknown, sender: string, recipient: string): number {
    const lastBlock: IBlock = this.getLastBlock();
    const indexOfLastBlock: number = lastBlock['index'];
    const blockIndexOfThisTransaction: number = inc(indexOfLastBlock);

    const newTransaction: ITransaction = {
      payload,
      sender,
      recipient
    };

    this._pendingTransactions.push(newTransaction);

    return blockIndexOfThisTransaction;
  }

  public hashBlock(previousBlockHash: string, currentBlockData: Array<ITransaction>, nonce: number): string {
    const nonceString: string = nonce.toString();
    const currentBlockDataString: string = JSON.stringify(currentBlockData);
    const dataAsString = `${previousBlockHash}${nonceString}${currentBlockDataString}`;

    return x2(dataAsString);
  }

  public proofOfWork(previousBlockHash: string, currentBlockData: Array<ITransaction>): number {
    let nonce = -1;
    let tempHash: string;

    do {
      tempHash = this.hashBlock(previousBlockHash, currentBlockData, ++nonce);
    } while(not(tempHash.startsWith('0000')));

    return nonce;
  }
}
