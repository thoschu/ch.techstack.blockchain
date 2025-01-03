import { v7 as UUIDv7 } from 'uuid';

export class Transaction<T> {
  private readonly _id: string = UUIDv7().split('-').join('');
  private readonly _sender: string;
  private readonly _receiver: string;
  private readonly _amount: T;
  private _contract?: Record<'name' & 'data', Symbol | unknown>;

  constructor(sender: string, receiver: string, amount: T) {
    this._sender = sender;
    this._receiver = receiver;
    this._amount = amount;
  }

  public get id(): string {
    return this._id;
  }

  public get sender(): string {
    return this._sender;
  }

  public get receiver(): string {
    return this._receiver;
  }

  public get amount(): T {
    return this._amount;
  }

  public get contract(): Record<'name' & 'data', Symbol | unknown> | undefined {
    return this._contract;
  }
  public set contract(contract: Record<'name' & 'data', Symbol | unknown>) {
    this._contract = contract;
  }
}
