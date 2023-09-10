import * as crypto from 'crypto';

import { ContractI } from '@/smart-contract/contract.interface';

class TestContract implements ContractI {
    private balances: Record<string, number> = {}; // Speichert die Kontostände der Benutzer

    // Konstruktor, um Token zu erstellen
    constructor(initialSupply: number) {
        this.balances.smartContract = initialSupply; // Der Smart Contract erstellt die Tokens
    }

    // Funktion zur Übertragung von Token von einem Benutzer zum anderen
    public transfer(sender: string, receiver: string, amount: number, signature: string): boolean {
        // Überprüfung der Signatur (vereinfacht, in der Realität komplexer)
        if (this.verifySignature(sender, signature) && this.balances[sender] >= amount) {
            this.balances[sender] -= amount;
            this.balances[receiver] = (this.balances[receiver] || 0) + amount;
            return true;
        }
        return false;
    }

    // Funktion zur Überprüfung der Signatur (vereinfacht)
    private verifySignature(sender: string, signature: string): boolean {
        const data = sender + signature; // Daten, die signiert wurden
        const hash = crypto.createHash('SHA256').update(data).digest('hex');
        // Vereinfachte Überprüfung: Die Signatur entspricht dem gehashten Wert
        return hash === signature;
    }

    // Funktion zur Abfrage des Kontostands eines Benutzers
    getBalance(account: string): number {
        return this.balances[account] || 0;
    }

    readonly do: unknown;
    readonly name: string;
    readonly nonce: number;
    readonly timestamp: number;
}

// // Test des Smart Contracts
// const myTokenContract = new TestContract(1000); // Smart Contract erstellt 1000 Token
//
// // Simulierte Transaktionen
// const sender = 'Alice';
// const receiver = 'Bob';
// const amount = 100;
// const signature = crypto.createHash('SHA256').update(sender + receiver + amount.toString()).digest('hex'); // Vereinfachte Signatur
//
// const success = myTokenContract.transfer(sender, receiver, amount, signature);
//
// if (success) {
//     console.log(`Transaktion von ${sender} an ${receiver} über ${amount} Token wurde erfolgreich durchgeführt.`);
// } else {
//     console.log(`Transaktion von ${sender} an ${receiver} über ${amount} Token wurde abgelehnt.`);
// }
//
// console.log(`Kontostand von ${sender}: ${myTokenContract.getBalance(sender)}`);
// console.log(`Kontostand von ${receiver}: ${myTokenContract.getBalance(receiver)}`);
