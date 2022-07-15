export interface IBlock {
  index: number;
  timestamp: number;
  transactions: Array<ITransaction>;
  nonce: number;
  previousBlockHash: string;
  hash: string;
}

export interface ITransaction {
  payload: unknown;
  sender: string;
  recipient: string;
}

export interface IBlockchain<B> {
  createNewBlock(nonce: number, previousBlockHash: string, hash: string): B;
  getLastBlock(): B;
  createNewTransaction(payload: unknown, sender: string, recipient: string): number;
  hashBlock(previousBlockHash: string, currentBlockData: Array<ITransaction>, nonce: number): string;
  proofOfWork(previousBlockHash: string, currentBlockData: Array<ITransaction>): number;
}
