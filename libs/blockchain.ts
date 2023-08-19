import { createHash } from 'node:crypto';

export class Blockchain {
    private readonly user: string;
    constructor(user?: string) {
        this.user = user ?? 'Tom S.';
    }

    public greeter(person: string = this.user): string {
        return "Hello, " + person;
    }

    public getHash(): string {
        const greeting: string = this.greeter(this.user);

        return createHash('sha512').update(greeting).digest('hex')
    }
}
