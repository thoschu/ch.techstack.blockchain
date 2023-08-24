import { randomUUID} from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Blockchain, CurrentBlockData } from '@/blockchain';
import { BlockI } from '@/block/block.interface';
import { TransactionI } from '@/transaction/transaction.interface';
import { inc } from 'ramda';

export type MineResponse = Record<'note', string> & Record<'block', BlockI>;
export type MinePayload = { nonce: number, previousBlockHash: string, hash: string };
export type PendingTransactionPayload = Record<'value', unknown> & Record<'sender' | 'recipient', string> & Partial<Record<'data', unknown>>;

@Injectable()
export class AppService {
  private readonly blockchain: Blockchain;
  public readonly nodeUUID: string;

  constructor() {
    this.blockchain = new Blockchain();
    this.nodeUUID = randomUUID();
  }
  public getBlockchain(): Blockchain {
    return this.blockchain
  }

  public createNewPendingTransaction({ value, sender, recipient, data }: PendingTransactionPayload): number {
    return this.blockchain.createNewPendingTransaction(value, sender, recipient, data);
  }

  public getLastBlock(): BlockI {
    return this.blockchain.getLastBlock()
  }

  public mine(): MineResponse {
    this.blockchain.createNewPendingTransaction(null, '00', this.nodeUUID);

    const payload: MinePayload = this.getCreateMineResponsePayload();
    const mineResponse: MineResponse = this.createMineResponse(payload);

    return mineResponse;
  }

  private getCreateMineResponsePayload(): MinePayload {
    const lastBlock: BlockI = this.getLastBlock();
    const { index }: { index: number } = lastBlock;
    const previousBlockHash: string = lastBlock.hash;
    const transactions: TransactionI[] = this.blockchain.pendingTransactions
    const currentBlockData: CurrentBlockData = { index: inc(index), transactions };
    const nonce: number = this.blockchain.proofOfWork(previousBlockHash, currentBlockData);
    const hash: string = this.blockchain.calculateHash(previousBlockHash, currentBlockData, nonce);

    return { nonce, previousBlockHash, hash };
  }

  private createMineResponse({ nonce, previousBlockHash, hash }: MinePayload): MineResponse  {
    const block: BlockI =  this.blockchain.createNewBlockInChain(nonce, previousBlockHash, hash);
    const note: string = 'New block mined successfully.';

    return { note, block };
  }
}
