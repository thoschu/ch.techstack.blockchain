import {SmartContract} from "@blockchain/smartcontract/smartcontract.interface";
import Block from "@blockchain/block/block.class";

export class TokenContract<T> implements SmartContract<T, unknown> {
  private balances: Map<string, number> = new Map();

  execute(data: { type: string; address: string; amount?: number }, blockchain: Block<T>[]): any {
    const { type, address, amount } = data;

    switch (type) {
      case "mint":
        if (!amount || amount <= 0) throw new Error("Invalid amount");
        const currentBalance = this.balances.get(address) || 0;
        this.balances.set(address, currentBalance + amount);
        return { success: true, balance: this.balances.get(address) };

      case "transfer":
        if (!amount || amount <= 0) throw new Error("Invalid amount");
        const senderBalance = this.balances.get(address) || 0;
        if (senderBalance < amount) throw new Error("Insufficient funds");
        // @ts-ignore
        const recipient = data["recipient"];
        if (!recipient) throw new Error("Recipient address is required");

        this.balances.set(address, senderBalance - amount);
        const recipientBalance = this.balances.get(recipient) || 0;
        this.balances.set(recipient, recipientBalance + amount);
        return { success: true, balance: this.balances.get(address) };

      case "balance":
        return { balance: this.balances.get(address) || 0 };

      default:
        throw new Error("Invalid operation type");
    }
  }
}
