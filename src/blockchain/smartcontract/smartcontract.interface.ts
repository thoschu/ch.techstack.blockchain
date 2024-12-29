import Block from '@blockchain/block/block.class';

export interface SmartContract<T, S> {
  execute(data: unknown, context: any, blockchain: Block<T>[]): S;
}
