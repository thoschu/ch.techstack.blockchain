export interface IBlock {
  index: number;
  timestamp: number;
  transactions: Array<ITransaction>;
  nonce: number;
  previousBlockHash: string;
  hash: string;
}

export interface ITransaction {
  payload: string;
  sender: string;
  recipient: string;
}

export interface IBlockchain<B, T> {
  createNewBlock(nonce: number, previousBlockHash: string, hash: string): B;
  getLastBlock(): B;
  createNewTransaction(payload: string, sender: string, recipient: string): number;
  hashBlock(previousBlockHash: string, currentBlockData: Array<T>, nonce: number): string;
  proofOfWork(previousBlockHash: string, currentBlockData: Array<T>): number;
  get chain(): Array<B>;
  get pendingTransactions(): Array<T>;
}
